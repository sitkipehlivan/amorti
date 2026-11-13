# Amorti mobil uygulaması (iOS + Android)

Capacitor 8 ile hazırlanmış yerel kabuk. Uygulama canlı siteyi açar; haberler, banka faizleri ve hesaplama
araçları siteyle birlikte anında güncellenir, mağazaya yeniden gönderim gerekmez. İnternet yoksa `www/index.html`
gösterilir. EV Türkiye uygulamasıyla aynı yapı.

- Paket kimliği: `com.amorti.app` · Uygulama adı: Amorti
- Site adresi: `capacitor.config.ts` → `SITE` (şimdilik amorti-mugw.netlify.app; kendi alan adı bağlanınca güncellenip `npx cap sync` çalıştırılmalı)
- Simge ve açılış ekranı: `resources/` (üretici: `node ../scripts/app-ikon.js`) → `npm run assets`
- Yerel eklentiler: uygulama içi tarayıcı (sahibinden / Hepsiemlak / Emlakjet ve banka linkleri bununla açılır), paylaşım, açılış ekranı, durum çubuğu
- Site, uygulamada açıldığını kullanıcı aracısındaki `AmortiApp/1.0` ekinden anlar (`html.in-app` sınıfı).

## Derleme
- Android: `npm ci && npx cap sync android && npx cap open android` (Android Studio) → Build → Generate Signed App Bundle (AAB) → Google Play Console
- iOS: Mac + Xcode: `npm ci && npx cap sync ios && npx cap open ios` → Product → Archive → App Store Connect

## Yayın öncesi
1. Android imza anahtarı (`.jks`) depoya girmez; güvenli yerde sakla, Play App Signing'i aç.
2. Her yeni sürümde `android/app/build.gradle` içinde `versionCode` +1, `versionName` güncelle (iOS'ta Xcode'da Version/Build).
3. Mağaza metinleri ve beyanlar: `store/google-play.md`.
4. Reklam: AdSense uygulama içi web görünümünde kullanılamaz. Uygulamada reklam için Ad Manager / AdMob (WebView API for Ads) gerekir; `html.in-app` sınıfı ile ayırt edilir.
