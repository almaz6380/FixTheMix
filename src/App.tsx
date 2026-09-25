// Platzhalter. Phase 1 baut nur src/engine/ — die Oberflaeche kommt in Phase 2
// (Bar-Look, Giess-Animation, Haptik). Diese Datei existiert, damit
// `npm run build` schon jetzt gruen laeuft und das Geruest belastbar ist.
import { useTranslation } from 'react-i18next'

export default function App() {
  const { t } = useTranslation()
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-3xl font-semibold text-zitrus-400">{t('app.name')}</h1>
      <p className="text-bar-600">{t('app.baustelle')}</p>
    </main>
  )
}
