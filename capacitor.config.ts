import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Reverse-Domain nach Betreiber Josef Gallab (Konvention wie at.gallab.animequiz)
  appId: 'at.gallab.fixthemix',
  appName: 'FixTheMix',
  webDir: 'dist',
  // Dunkel wie das Studio-Intro (StudioIntro.tsx): erst Startbild, dann Intro,
  // dann die Bar — ohne Farbblitz dazwischen.
  backgroundColor: '#020814',
};

export default config;
