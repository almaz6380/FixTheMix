# Reicht eine iOS-Version bei Apple zur Pruefung ein — ohne App Store Connect
# im Browser. Muster aus almaz6380/Mountain-Ride (tools/asc-upload.py).
#
# Josef, 08.11.2026: „wie reiche ich iOS ein? … das machst du ja sonst auch
# immer". Bis dahin lud `ios-release.yml` nur hoch, und das Einreichen war
# Handarbeit im Browser. Mit demselben API-Schluessel geht beides.
#
# Ablauf (jeder Schritt ist wiederholbar, ein zweiter Lauf macht nichts doppelt):
#   1. App ueber die Bundle-ID finden
#   2. auf den Build warten, bis Apple ihn verarbeitet hat (VALID)
#   3. die Version anlegen oder die offene wiederverwenden
#   4. den Build anhaengen
#   5. „Neuerungen" in jeder Sprache setzen (Deutsch fuer de-*, sonst Englisch)
#   6. Pruefung anlegen, Version hinzufuegen, einreichen
#
# Aufruf (die drei Werte kommen aus den Repo-Secrets):
#   ASC_KEY_ID=… ASC_ISSUER_ID=… ASC_KEY_P8_BASE64=… \
#     python3 scripts/asc-einreichen.py --version 1.1.0 --build 2 [--nur-vorbereiten]
import argparse
import base64
import os
import sys
import time

import jwt
import requests

BUNDLE = 'at.gallab.fixthemix'
API = 'https://api.appstoreconnect.apple.com'

# Die Versionshinweise stehen auch in CLAUDE.md („Versionshinweise 1.1.1").
NEU = {
    'de': 'Echteres Umleeren: Das Glas fährt zum Zielglas, kippt und gießt sichtbar hinüber '
          '— mit echtem Gießgeräusch. Kleine Verbesserungen.',
    'en': 'More realistic pouring: the glass moves over the target, tilts and pours — with a '
          'real pouring sound. Small improvements.',
}

KEY = base64.b64decode(''.join(os.environ['ASC_KEY_P8_BASE64'].split())).decode()


def token():
    now = int(time.time())
    return jwt.encode(
        {'iss': os.environ['ASC_ISSUER_ID'], 'iat': now, 'exp': now + 1100, 'aud': 'appstoreconnect-v1'},
        KEY, algorithm='ES256', headers={'kid': os.environ['ASC_KEY_ID'], 'typ': 'JWT'})


def call(method, path, body=None, params=None, ok=()):
    r = requests.request(method, API + path, json=body, params=params, timeout=120,
                         headers={'Authorization': 'Bearer ' + token(), 'Content-Type': 'application/json'})
    if r.status_code >= 400:
        if r.status_code in ok:
            return None
        raise SystemExit(f'{method} {path} -> {r.status_code}\n{r.text[:3000]}')
    return r.json() if r.text else {}


def rel(art, id_):
    return {'data': {'type': art, 'id': id_}}


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--version', required=True)
    a.add_argument('--build', required=True)
    a.add_argument('--nur-vorbereiten', action='store_true',
                   help='alles bis auf das eigentliche Einreichen')
    a.add_argument('--warten-min', type=int, default=45)
    arg = a.parse_args()

    # 1. App
    apps = call('GET', '/v1/apps', params={'filter[bundleId]': BUNDLE})['data']
    if not apps:
        raise SystemExit(f'Keine App mit der Bundle-ID {BUNDLE} gefunden.')
    app = apps[0]['id']
    print(f'App {BUNDLE}: {app}')

    # 2. Build — Apple braucht nach dem Upload oft 5–30 Minuten.
    ende = time.time() + arg.warten_min * 60
    build = None
    while True:
        b = call('GET', '/v1/builds', params={
            'filter[app]': app, 'filter[version]': arg.build,
            'filter[preReleaseVersion.version]': arg.version, 'limit': 1})['data']
        if b:
            zustand = b[0]['attributes'].get('processingState')
            print(f'Build {arg.version} ({arg.build}): {zustand}')
            if zustand == 'VALID':
                build = b[0]['id']
                break
            if zustand in ('FAILED', 'INVALID'):
                raise SystemExit('Apple hat den Build abgelehnt — siehe E-Mail von App Store Connect.')
        else:
            print(f'Build {arg.version} ({arg.build}) noch nicht sichtbar …')
        if time.time() > ende:
            raise SystemExit('Zeitlimit: der Build ist noch nicht verarbeitet. Spaeter erneut starten.')
        time.sleep(60)

    # 3. Version
    versionen = call('GET', f'/v1/apps/{app}/appStoreVersions',
                     params={'filter[platform]': 'IOS', 'limit': 50})['data']
    for v in versionen:
        print(f'  vorhanden: {v["attributes"]["versionString"]} — {v["attributes"]["appStoreState"]}')
    v = next((x for x in versionen if x['attributes']['versionString'] == arg.version), None)
    if v is None:
        v = call('POST', '/v1/appStoreVersions', {'data': {
            'type': 'appStoreVersions',
            'attributes': {'platform': 'IOS', 'versionString': arg.version, 'releaseType': 'AFTER_APPROVAL'},
            'relationships': {'app': rel('apps', app)}}})['data']
        print(f'Version {arg.version} angelegt.')
    ver = v['id']
    zustand = v['attributes']['appStoreState']
    if zustand in ('WAITING_FOR_REVIEW', 'IN_REVIEW', 'PENDING_DEVELOPER_RELEASE', 'READY_FOR_SALE'):
        print(f'Version {arg.version} ist bereits {zustand} — nichts zu tun.')
        return

    # 4. Build anhaengen
    call('PATCH', f'/v1/appStoreVersions/{ver}/relationships/build', rel('builds', build))
    print('Build angehaengt.')

    # 5. Neuerungen in jeder Sprache
    for lok in call('GET', f'/v1/appStoreVersions/{ver}/appStoreVersionLocalizations',
                    params={'limit': 50})['data']:
        sprache = lok['attributes']['locale']
        text = NEU['de'] if sprache.startswith('de') else NEU['en']
        call('PATCH', f'/v1/appStoreVersionLocalizations/{lok["id"]}', {'data': {
            'type': 'appStoreVersionLocalizations', 'id': lok['id'], 'attributes': {'whatsNew': text}}})
        print(f'  Neuerungen gesetzt: {sprache}')

    if arg.nur_vorbereiten:
        print('Nur vorbereitet — nicht eingereicht.')
        return

    # 6. Einreichen. Eine offene Pruefung (READY_FOR_REVIEW) wird wiederverwendet.
    offen = call('GET', '/v1/reviewSubmissions', params={
        'filter[app]': app, 'filter[platform]': 'IOS',
        'filter[state]': 'READY_FOR_REVIEW,UNRESOLVED_ISSUES'})['data']
    if offen:
        sub = offen[0]['id']
        print(f'Offene Pruefung wiederverwendet: {sub} ({offen[0]["attributes"]["state"]})')
    else:
        sub = call('POST', '/v1/reviewSubmissions', {'data': {
            'type': 'reviewSubmissions', 'attributes': {'platform': 'IOS'},
            'relationships': {'app': rel('apps', app)}}})['data']['id']
        print(f'Pruefung angelegt: {sub}')
    # 409 heisst: die Version steckt schon in dieser Pruefung.
    call('POST', '/v1/reviewSubmissionItems', {'data': {
        'type': 'reviewSubmissionItems',
        'relationships': {'reviewSubmission': rel('reviewSubmissions', sub),
                          'appStoreVersion': rel('appStoreVersions', ver)}}}, ok=(409,))
    call('PATCH', f'/v1/reviewSubmissions/{sub}', {'data': {
        'type': 'reviewSubmissions', 'id': sub, 'attributes': {'submitted': True}}})
    print(f'EINGEREICHT: FixTheMix {arg.version} ({arg.build}) wartet auf Apples Pruefung.')


if __name__ == '__main__':
    sys.exit(main())
