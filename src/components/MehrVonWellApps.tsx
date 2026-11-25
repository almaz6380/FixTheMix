// „Mehr von WellApps": die sechs anderen Apps desselben Studios, als Liste in
// den Einstellungen. Eigenwerbung ohne Werbenetz — nichts wird nachgeladen,
// kein Klick wird gezaehlt, die Symbole liegen im Bundle.
//
// DIE LISTE WIRD IN ALLEN SIEBEN APPS GLEICH GEPFLEGT (Reihenfolge, Store-IDs,
// Kurzzeilen). Die eigene App (`fixthemix`) steht hier nicht.
//
// Geoeffnet wird mit einem gewoehnlichen Link und `target="_blank"`: Capacitor
// reicht jede Adresse, die nicht zur App gehoert, an das System weiter (iOS
// `UIApplication.open`, Android `ACTION_VIEW`) — sie geht also AUSSERHALB der
// WebView auf, im Store bzw. im Browser. Dafuer braucht es kein Plugin.

import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';
import mahjong from '../assets/wellapps/mahjong.webp';
import anigosha from '../assets/wellapps/anigosha.webp';
import swaply from '../assets/wellapps/swaply.webp';
import weltgeschichte from '../assets/wellapps/weltgeschichte.webp';
import watten from '../assets/wellapps/watten.webp';
import fullrep from '../assets/wellapps/fullrep.webp';

type WellApp = {
  id: string;
  /** Fester Name — oder `null`, wenn er aus den Sprachdateien kommt. */
  name: string | null;
  appStore: string;
  paket: string;
  bild: string;
};

const APPS: WellApp[] = [
  { id: 'mahjong', name: 'Mahjong Royale', appStore: '6787721454', paket: 'com.mahjongroyale.app', bild: mahjong },
  { id: 'anigosha', name: 'Anigosha', appStore: '6797757350', paket: 'at.gallab.animequiz', bild: anigosha },
  { id: 'swaply', name: 'Swaply', appStore: '6787695557', paket: 'at.gallab.swaply', bild: swaply },
  // Die einzige App, deren Name uebersetzt wird (`wellapps.weltgeschichteName`).
  { id: 'weltgeschichte', name: null, appStore: '6811862606', paket: 'de.almaz.weltgeschichte', bild: weltgeschichte },
  { id: 'watten', name: 'Watten & Schnapsen', appStore: '6800774882', paket: 'at.doppeldeutsch.karten', bild: watten },
  { id: 'fullrep', name: 'FullRep', appStore: '6788461300', paket: 'at.gallab.mypeak', bild: fullrep },
];

/** iPhone/iPad — als App oder im Browser. Ein iPad gibt sich als Mac aus und
    verraet sich nur ueber die Beruehrungspunkte. */
function istIos(): boolean {
  const p = Capacitor.getPlatform();
  if (p === 'ios') return true;
  if (p === 'android') return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export default function MehrVonWellApps() {
  const { t } = useTranslation();
  const ios = istIos();
  return (
    <nav className="einst-karte flex flex-col" data-wellapps>
      {APPS.map((a) => (
        <a
          key={a.id}
          href={ios
            ? `https://apps.apple.com/app/id${a.appStore}`
            : `https://play.google.com/store/apps/details?id=${a.paket}`}
          target="_blank"
          rel="noopener noreferrer"
          // Als Stil und nicht als Klasse: `.einst-zeile` steht ungeschichtet in
          // index.css und schluege jede Tailwind-Utility.
          className="einst-zeile einst-link"
          style={{ justifyContent: 'flex-start' }}
        >
          <img
            src={a.bild}
            alt=""
            width={48}
            height={48}
            loading="lazy"
            className="h-12 w-12 flex-shrink-0 rounded-[22%]"
          />
          <span className="flex min-w-0 flex-col text-start">
            <span className="break-words">{a.name ?? t('wellapps.weltgeschichteName')}</span>
            <span className="font-sans text-[13px] leading-snug font-semibold break-words text-rauch">
              {t(`wellapps.${a.id}`)}
            </span>
          </span>
        </a>
      ))}
    </nav>
  );
}
