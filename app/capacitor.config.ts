import type { CapacitorConfig } from '@capacitor/cli';

// Uygulama canlı siteyi açar: haberler, faiz oranları ve araçlar siteyle birlikte anında güncellenir,
// mağazaya yeniden gönderim gerekmez. İnternet yoksa www/index.html gösterilir.
// Alan adı değişirse SITE ve allowNavigation güncellenip npx cap sync çalıştırılmalı.
const SITE = process.env.AMORTI_SITE || 'https://amorti.online';
const HOST = new URL(SITE).hostname;

const config: CapacitorConfig = {
  appId: 'com.amorti.app',
  appName: 'Amorti',
  webDir: 'www',
  // Site, uygulama içinde açıldığını bu ekten anlar (ör. AdSense uygulamada yüklenmez: Google politikası).
  appendUserAgent: 'AmortiApp/1.0',
  server: {
    url: SITE,
    errorPath: 'index.html',
    // Bunların dışındaki adresler (sahibinden, Hepsiemlak, Emlakjet, banka siteleri) uygulama içi tarayıcıda açılır.
    allowNavigation: [HOST, 'www.amorti.online', 'amorti-mugw.netlify.app', 'amortisite.b-cdn.net'],
  },
  ios: { contentInset: 'automatic', scheme: 'Amorti' },
  android: { allowMixedContent: false },
  plugins: {
    SplashScreen: { launchShowDuration: 1000, backgroundColor: '#ffffff', showSpinner: false },
  },
};

export default config;
