#!/usr/bin/env python3
"""Store-Bilder fuer Google Play: Screenshots und Feature-Grafik in JEDER Sprache
des Store-Eintrags ersetzen — in EINER Edit-Transaktion.

Josef, 13.11.2026: die Store-Bilder zeigten noch das alte Design. `play-upload.py
--screenshots` kann eine Sprache je Lauf; bei zwanzig Sprachen hiesse das zwanzig
Edits und zwanzig Pruefungen. Hier wird einmal geoeffnet, alles getauscht und
einmal abgeschickt.

Erwartet die Ausgabe von `tools/store-bilder.mjs` unter `.store/<app-code>/`
(Dateien `play-<nr>-<name>.png` und `play-feature-1024x500.png`). Jede Sprache
des Play-Eintrags bekommt die Bilder ihrer App-Sprache; fehlt die, die englischen.

Aufruf (in der CI): PLAY_KEY=key.json python3 scripts/play-bilder.py [--dry-run]
"""
import argparse
import glob
import importlib.util
import os
import re
import sys

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# play-upload.py hat einen Bindestrich im Namen und laesst sich nicht direkt
# importieren — also ueber importlib. Token, Aufruf und der vorsichtige
# Abschluss (commit_edit) sind dieselben wie beim Hochladen der App.
_spec = importlib.util.spec_from_file_location('play_upload', os.path.join(WURZEL, 'scripts', 'play-upload.py'))
pu = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(pu)


def app_sprache(play_code: str) -> str:
    """Play-Locale -> Ordner unter .store/ (die Codes aus src/i18n/sprachen.ts)."""
    c = play_code.lower()
    if c in ('zh-tw', 'zh-hk'):
        return 'zh-Hant'
    if c.startswith('zh'):
        return 'zh-Hans'
    return c.split('-')[0]


def bilder(ordner: str):
    """Die Play-Screenshots eines Sprachordners, nach ihrer Nummer sortiert."""
    gefunden = []
    for pfad in glob.glob(os.path.join(ordner, 'play-*.png')):
        m = re.match(r'play-(\d+)-', os.path.basename(pfad))
        if m:
            gefunden.append((int(m.group(1)), pfad))
    return [p for _, p in sorted(gefunden)]


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--store', default=os.path.join(WURZEL, '.store'))
    a.add_argument('--dry-run', action='store_true', help='nur auflisten, nichts aendern')
    arg = a.parse_args()

    tok = pu.token()
    eid = pu.call(tok, 'POST', f'{pu.API}/applications/{pu.PKG}/edits')['id']
    print(f'Edit {eid} geoeffnet')
    eintraege = pu.call(tok, 'GET', f'{pu.API}/applications/{pu.PKG}/edits/{eid}/listings').get('listings', [])
    if not eintraege:
        sys.exit('Der Play-Eintrag hat keine Sprachen — nichts zu tun.')

    for e in eintraege:
        sprache = e['language']
        code = app_sprache(sprache)
        ordner = os.path.join(arg.store, code)
        if not os.path.isdir(ordner):
            print(f'  {sprache}: keine Bilder fuer „{code}", nehme Englisch')
            code, ordner = 'en', os.path.join(arg.store, 'en')
        shots = bilder(ordner)
        feature = os.path.join(ordner, 'play-feature-1024x500.png')
        if not shots:
            sys.exit(f'Keine Play-Screenshots in {ordner} — erst tools/store-bilder.mjs laufen lassen.')
        print(f'  {sprache} <- {code}: {len(shots)} Screenshots'
              + (' + Feature-Grafik' if os.path.exists(feature) else ''))
        if arg.dry_run:
            continue
        basis = f'applications/{pu.PKG}/edits/{eid}/listings/{sprache}'
        pu.call(tok, 'DELETE', f'{pu.API}/{basis}/phoneScreenshots')
        for s in shots:
            with open(s, 'rb') as fh:
                pu.call(tok, 'POST', f'{pu.UPLOAD}/{basis}/phoneScreenshots?uploadType=media',
                        data=fh.read(), ctype='image/png')
        if os.path.exists(feature):
            pu.call(tok, 'DELETE', f'{pu.API}/{basis}/featureGraphic')
            with open(feature, 'rb') as fh:
                pu.call(tok, 'POST', f'{pu.UPLOAD}/{basis}/featureGraphic?uploadType=media',
                        data=fh.read(), ctype='image/png')

    if arg.dry_run:
        try:
            pu.call(tok, 'DELETE', f'{pu.API}/applications/{pu.PKG}/edits/{eid}', fatal=False)
        except pu.ApiError:
            pass  # eine offene Edit verfaellt ohnehin von selbst
        print('--dry-run: nichts geaendert.')
        return
    pu.commit_edit(tok, eid)
    print(f'FERTIG: Play-Bilder in {len(eintraege)} Sprachen ersetzt.')


if __name__ == '__main__':
    main()
