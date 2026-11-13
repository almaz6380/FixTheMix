# Store-Bilder fuer den App Store: Screenshots in jeder Sprache des Eintrags
# ersetzen — iPhone 6,7″, iPhone 6,5″ und iPad 13″. Muster aus Mountain Ride
# (tools/asc-upload.py), Hilfsfunktionen wie in scripts/asc-einreichen.py.
#
# Josef, 13.11.2026: die Store-Bilder zeigten noch das alte Design.
#
# APPLES GRENZE: Bilder haengen an einer VERSION, und aendern laesst sich nur
# eine Version, die noch nicht eingereicht ist. Ist die neueste in Pruefung oder
# im Store, legt das Skript die naechste an (1.1.0 -> 1.1.1) und haengt die
# Bilder dort an — sichtbar werden sie mit dem naechsten Update. Laesst Apple
# das Anlegen gerade nicht zu (eine Version steckt noch in der Pruefung), sagt
# das Skript das und endet ohne Fehler.
#
# Erwartet die Ausgabe von tools/store-bilder.mjs unter .store/<app-code>/.
# Aufruf: ASC_KEY_ID=… ASC_ISSUER_ID=… ASC_KEY_P8_BASE64=… python3 scripts/asc-bilder.py
import argparse
import base64
import glob
import hashlib
import os
import re
import time

import jwt
import requests

BUNDLE = 'at.gallab.fixthemix'
API = 'https://api.appstoreconnect.apple.com'
WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Geraet in tools/store-bilder.mjs -> Anzeigetyp bei Apple
GERAETE = {
    'ios-6.7': 'APP_IPHONE_67',          # 1290 x 2796
    'ios-6.5': 'APP_IPHONE_65',          # 1242 x 2688
    'ipad-13': 'APP_IPAD_PRO_3GEN_129',  # 2064 x 2752
}
BEARBEITBAR = ('PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED',
               'METADATA_REJECTED', 'INVALID_BINARY')

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
            return {'_fehler': r.status_code, '_text': r.text}
        raise SystemExit(f'{method} {path} -> {r.status_code}\n{r.text[:3000]}')
    return r.json() if r.text else {}


def rel(art, id_):
    return {'data': {'type': art, 'id': id_}}


def app_sprache(locale):
    """App-Store-Locale -> Ordner unter .store/."""
    c = locale.lower()
    if c in ('zh-hant', 'zh-tw', 'zh-hk'):
        return 'zh-Hant'
    if c.startswith('zh'):
        return 'zh-Hans'
    return c.split('-')[0]


def bilder(ordner, geraet):
    gefunden = []
    for pfad in glob.glob(os.path.join(ordner, f'{geraet}-*.png')):
        m = re.match(re.escape(geraet) + r'-(\d+)-', os.path.basename(pfad))
        if m:
            gefunden.append((int(m.group(1)), pfad))
    return [p for _, p in sorted(gefunden)]


def hochladen(set_id, pfad):
    daten = open(pfad, 'rb').read()
    res = call('POST', '/v1/appScreenshots', {'data': {
        'type': 'appScreenshots',
        'attributes': {'fileName': os.path.basename(pfad), 'fileSize': len(daten)},
        'relationships': {'appScreenshotSet': rel('appScreenshotSets', set_id)}}})['data']
    for op in res['attributes']['uploadOperations']:
        teil = daten[op['offset']:op['offset'] + op['length']]
        requests.request(op['method'], op['url'], data=teil, timeout=300,
                         headers={h['name']: h['value'] for h in op.get('requestHeaders', [])}).raise_for_status()
    call('PATCH', f'/v1/appScreenshots/{res["id"]}', {'data': {
        'type': 'appScreenshots', 'id': res['id'],
        'attributes': {'uploaded': True, 'sourceFileChecksum': hashlib.md5(daten).hexdigest()}}})


def naechste(version):
    teile = [int(x) for x in version.split('.')]
    while len(teile) < 3:
        teile.append(0)
    teile[-1] += 1
    return '.'.join(map(str, teile))


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--store', default=os.path.join(WURZEL, '.store'))
    arg = a.parse_args()

    app = call('GET', '/v1/apps', params={'filter[bundleId]': BUNDLE})['data'][0]['id']
    versionen = call('GET', f'/v1/apps/{app}/appStoreVersions',
                     params={'filter[platform]': 'IOS', 'limit': 50})['data']
    for v in versionen:
        print(f'  {v["attributes"]["versionString"]}: {v["attributes"]["appStoreState"]}')

    v = next((x for x in versionen if x['attributes']['appStoreState'] in BEARBEITBAR), None)
    if v is None:
        hoechste = max((x['attributes']['versionString'] for x in versionen),
                       key=lambda s: [int(t) for t in s.split('.')])
        neu = naechste(hoechste)
        res = call('POST', '/v1/appStoreVersions', {'data': {
            'type': 'appStoreVersions',
            'attributes': {'platform': 'IOS', 'versionString': neu, 'releaseType': 'AFTER_APPROVAL'},
            'relationships': {'app': rel('apps', app)}}}, ok=(409,))
        if '_fehler' in res:
            print(f'Apple laesst gerade keine neue Version zu ({res["_fehler"]}):\n{res["_text"][:600]}')
            print('Das heisst meist: eine Version steckt noch in der Pruefung. Nach deren '
                  'Freigabe dieses Workflow noch einmal starten.')
            return
        v = res['data']
        print(f'Neue Version {neu} angelegt (fuer die Bilder; sie traegt noch keinen Build).')
    ver = v['id']
    print(f'Bilder gehen an Version {v["attributes"]["versionString"]}')

    for lok in call('GET', f'/v1/appStoreVersions/{ver}/appStoreVersionLocalizations',
                    params={'limit': 50})['data']:
        locale = lok['attributes']['locale']
        code = app_sprache(locale)
        ordner = os.path.join(arg.store, code)
        if not os.path.isdir(ordner):
            code, ordner = 'en', os.path.join(arg.store, 'en')
        sets = {s['attributes']['screenshotDisplayType']: s['id'] for s in
                call('GET', f'/v1/appStoreVersionLocalizations/{lok["id"]}/appScreenshotSets')['data']}
        for geraet, typ in GERAETE.items():
            neu = bilder(ordner, geraet)
            if not neu:
                raise SystemExit(f'Keine {geraet}-Bilder in {ordner}.')
            set_id = sets.get(typ)
            if set_id:
                for alt in call('GET', f'/v1/appScreenshotSets/{set_id}/appScreenshots')['data']:
                    call('DELETE', f'/v1/appScreenshots/{alt["id"]}')
            else:
                set_id = call('POST', '/v1/appScreenshotSets', {'data': {
                    'type': 'appScreenshotSets', 'attributes': {'screenshotDisplayType': typ},
                    'relationships': {'appStoreVersionLocalization':
                                      rel('appStoreVersionLocalizations', lok['id'])}}})['data']['id']
            for pfad in neu:
                hochladen(set_id, pfad)
            print(f'  {locale} <- {code}: {typ} {len(neu)} Bilder')
    print('FERTIG: App-Store-Bilder ersetzt.')


if __name__ == '__main__':
    main()
