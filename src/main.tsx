import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import './i18n'
import App from './App.tsx'
import Start from './pages/Start.tsx'
import LevelSeite from './pages/LevelSeite.tsx'
import Einstellungen from './pages/Einstellungen.tsx'
import RechtsSeite from './pages/RechtsSeite.tsx'
import StudioIntro from './components/StudioIntro.tsx'

// Seit Phase 5 gibt es Routen, und zwar nicht aus Schoenheit: Apple und Google
// verlangen eine oeffentlich erreichbare Datenschutz-URL, Google Play zusaetzlich
// eine Adresse fuer den Weg zur Datenloeschung. Beides muss ohne App und ohne
// Anmeldung aufrufbar sein — ein Fenster ueber dem Spiel hat keine Adresse, die
// man in ein Store-Formular eintragen kann.
//
// Damit ein Neuladen auf /datenschutz nicht 404 gibt, liefert Cloudflare
// (`wrangler.jsonc`, not_found_handling) fuer alles, was keine Datei ist, index.html aus.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Das WellApps-Logo beim Oeffnen, nur in der Store-App (siehe dort). */}
    <StudioIntro />
    <BrowserRouter>
      <Routes>
        {/* Der Aufbau, seit dem 27.09.2026:
              /              Startbildschirm — die Haustuer
              /spiel         die Levelfolge
              /tagesraetsel  das Raetsel des Tages
              /duell         ein Duell
              /level         die Levelwahl

            Vorher lag unter `/` sofort der Spielbildschirm, und Levelwahl,
            Tagesraetsel und Duelle steckten in einem FENSTER darueber,
            erreichbar nur ueber den Burger. Damit hatte nichts davon eine
            Adresse: ein Neuladen im Tagesraetsel landete in der Levelfolge,
            und die App oeffnete mitten in einem Level statt an einem
            Anfang. */}
        <Route path="/" element={<Start />} />
        <Route path="/spiel" element={<App startModus="folge" />} />
        <Route path="/tagesraetsel" element={<App startModus="tag" />} />
        <Route path="/duell" element={<App startModus="duell" />} />
        <Route path="/level" element={<LevelSeite />} />
        <Route path="/einstellungen" element={<Einstellungen />} />
        <Route path="/impressum" element={<RechtsSeite was="impressum" />} />
        <Route path="/datenschutz" element={<RechtsSeite was="datenschutz" />} />
        <Route path="/nutzungsbedingungen" element={<RechtsSeite was="nutzung" />} />
        <Route path="/daten-loeschen" element={<RechtsSeite was="loeschen" />} />
        {/* Alles andere zurueck an den Anfang, statt eine leere Seite zu
            zeigen. */}
        <Route path="*" element={<Start />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
