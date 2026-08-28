import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cosmicwisdom.app',
  appName: 'Cosmic Wisdom',
  webDir: 'dist/public',
  server: {
    url: 'https://cosmicwisdom.manus.space',
    cleartext: true
  }
};

export default config;
