import type { ConfigContext, ExpoConfig } from 'expo/config';

// Public values only. Secrets never go in the app (see docs/SETUP.md).
const webUrl = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://alt.example';
const webHost = new URL(webUrl).host;
const bundleId = process.env.APP_BUNDLE_ID ?? 'gr.alt.app';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'ΑΛΤ!',
  slug: 'alt',
  scheme: 'alt',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  // Guardian mode follows the system theme; parent mode always renders light.
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: bundleId,
    supportsTablet: false,
    associatedDomains: [`applinks:${webHost}`],
    infoPlist: {
      NSCameraUsageDescription: 'Η ΑΛΤ! χρειάζεται την κάμερα μόνο για να διαβάσει τον κωδικό σύνδεσης με την οικογένεια.',
      NSContactsUsageDescription: 'Η ΑΛΤ! διαβάζει μόνο τις επαφές της οικογένειας που θα διαλέξεις.',
    },
  },
  android: {
    package: bundleId,
    adaptiveIcon: {
      backgroundColor: '#0E5E5A',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    // expo-contacts adds WRITE_CONTACTS by default; we only ever read the contacts the user picks.
    blockedPermissions: ['android.permission.WRITE_CONTACTS'],
    // Invite links https://<web>/j/<token> open the app directly (Android App Links).
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: 'https', host: webHost, pathPrefix: '/j/' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  locales: {
    el: './locales/el.json',
    en: './locales/en.json',
  },
  plugins: [
    'expo-router',
    'expo-status-bar',
    'expo-secure-store',
    'expo-localization',
    'expo-font',
    'expo-dev-client',
    ['expo-camera', { cameraPermission: 'Η ΑΛΤ! χρειάζεται την κάμερα μόνο για να διαβάσει τον κωδικό σύνδεσης με την οικογένεια.', recordAudioAndroid: false }],
    ['expo-contacts', { contactsPermission: 'Η ΑΛΤ! διαβάζει μόνο τις επαφές της οικογένειας που θα διαλέξεις.' }],
  ],
  experiments: { typedRoutes: true },
  extra: { webUrl },
});
