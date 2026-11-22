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

# Die Versionshinweise stehen auch in CLAUDE.md („Versionshinweise 1.1.3").
NEU = {
    'de': 'Die Werbung zwischen den Leveln kommt jetzt erst, wenn du weitertippst, und '
          'nicht mehr mitten in die Siegfeier. Neu im Siegfenster: 30 Münzen per Video. '
          'Kleine Verbesserungen.',
    'en': 'Ads between levels now appear only when you tap to continue, no longer in the '
          'middle of the win celebration. New on the win screen: 30 coins for a video. '
          'Small improvements.',
}

BEARBEITBAR = ('PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED',
               'METADATA_REJECTED', 'INVALID_BINARY')
WARTET = ('WAITING_FOR_REVIEW', 'READY_FOR_REVIEW')

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
    a.add_argument('--ersetzen', action='store_true',
                   help='eine noch wartende aeltere Version zurueckziehen und durch diese ersetzen')
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

    # ERSETZEN (17.11.2026, Josef: „mach ganz fertig"). Apple laesst nur EINE
    # offene Version zu. Wartet eine aeltere noch auf die Pruefung, wird ihre
    # Pruefung abgebrochen und dieselbe Version auf die neue Nummer umbenannt —
    # die Store-Bilder haengen schon daran. Was Apple GERADE prueft (IN_REVIEW),
    # wird nicht angefasst.
    if v is None and arg.ersetzen:
        andere = [x for x in versionen if x['attributes']['versionString'] != arg.version]
        if any(x['attributes']['appStoreState'] == 'IN_REVIEW' for x in andere):
            print('Apple prueft gerade eine andere Version (IN_REVIEW) — nicht abgebrochen. '
                  'Nach deren Freigabe erneut starten.')
            return
        alt = next((x for x in andere if x['attributes']['appStoreState'] in WARTET), None)
        if alt is not None:
            subs = call('GET', '/v1/reviewSubmissions', params={
                'filter[app]': app, 'filter[platform]': 'IOS',
                'filter[state]': 'WAITING_FOR_REVIEW,READY_FOR_REVIEW,UNRESOLVED_ISSUES'})['data']
            for sub in subs:
                call('PATCH', f'/v1/reviewSubmissions/{sub["id"]}', {'data': {
                    'type': 'reviewSubmissions', 'id': sub['id'], 'attributes': {'canceled': True}}})
                print(f'Pruefung {sub["id"]} abgebrochen.')
            # Bis die Version wieder bearbeitbar ist, vergeht ein Moment.
            for _ in range(30):
                zust = call('GET', f'/v1/appStoreVersions/{alt["id"]}')['data']['attributes']['appStoreState']
                print(f'  {alt["attributes"]["versionString"]}: {zust}')
                if zust in BEARBEITBAR:
                    break
                time.sleep(10)
            else:
                raise SystemExit('Die alte Version wurde nicht wieder bearbeitbar.')
        versionen = call('GET', f'/v1/apps/{app}/appStoreVersions',
                         params={'filter[platform]': 'IOS', 'limit': 50})['data']
        offen = next((x for x in versionen if x['attributes']['appStoreState'] in BEARBEITBAR), None)
        if offen is not None:
            print(f'Version {offen["attributes"]["versionString"]} wird zu {arg.version}.')
            v = call('PATCH', f'/v1/appStoreVersions/{offen["id"]}', {'data': {
                'type': 'appStoreVersions', 'id': offen['id'],
                'attributes': {'versionString': arg.version}}})['data']

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
