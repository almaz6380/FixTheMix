import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import './i18n'
import App from './App.tsx'
import Einstellungen from './pages/Einstellungen.tsx'
import RechtsSeite from './pages/RechtsSeite.tsx'

// Seit Phase 5 gibt es Routen, und zwar nicht aus Schoenheit: Apple und Google
// verlangen eine oeffentlich erreichbare Datenschutz-URL, Google Play zusaetzlich
// eine Adresse fuer den Weg zur Datenloeschung. Beides muss ohne App und ohne
// Anmeldung aufrufbar sein — ein Fenster ueber dem Spiel hat keine Adresse, die
// man in ein Store-Formular eintragen kann.
//
// Damit ein Neuladen auf /datenschutz nicht 404 gibt, schreibt `vercel.json`
// alles, was nicht nach Datei aussieht, auf index.html um.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/einstellungen" element={<Einstellungen />} />
        <Route path="/impressum" element={<RechtsSeite was="impressum" />} />
        <Route path="/datenschutz" element={<RechtsSeite was="datenschutz" />} />
        <Route path="/nutzungsbedingungen" element={<RechtsSeite was="nutzung" />} />
        <Route path="/daten-loeschen" element={<RechtsSeite was="loeschen" />} />
        {/* Alles andere zurueck ins Spiel, statt eine leere Seite zu zeigen. */}
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
