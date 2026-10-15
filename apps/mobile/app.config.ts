import type { ConfigContext, ExpoConfig } from 'expo/config';

// Public values only. Secrets never go in the app (see docs/SETUP.md).
const webUrl = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://alt.example';
const webHost = new URL(webUrl).host;
const bundleId = process.env.APP_BUNDLE_ID ?? 'gr.alt.app';
/** EAS project (expo.dev, owner f1com). Not a secret. */
const easProjectId = 'd16dab41-7886-4136-a3c7-09daa33ce767';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'ΑΛΤ!',
  slug: 'alt',
  owner: 'f1com',
  // Over-the-air JS updates (EAS Update). Native changes always need a new build: the fingerprint changes.
  runtimeVersion: { policy: 'fingerprint' },
  updates: { url: `https://u.expo.dev/${easProjectId}` },
  scheme: 'alt',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  // Guardian mode follows the system theme; parent mode always renders light.
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: bundleId,
    appleTeamId: process.env.APPLE_TEAM_ID,
    // Shared with the Call Directory Extension (targets/calldirectory).
    entitlements: { 'com.apple.security.application-groups': [`group.${bundleId}`] },
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
    // Least privilege: drop permissions other plugins add by default. We only read the one contact picked,
    // never play audio in the background, and the photo picker needs no storage access.
    blockedPermissions: [
      'android.permission.WRITE_CONTACTS',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
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
    // Uploads source maps on EAS builds when SENTRY_ORG/SENTRY_PROJECT/SENTRY_AUTH_TOKEN are set.
    ...(process.env.SENTRY_ORG ? [['@sentry/react-native/expo', { organization: process.env.SENTRY_ORG, project: process.env.SENTRY_PROJECT }] as [string, object]] : []),
    'expo-router',
    'expo-status-bar',
    'expo-secure-store',
    'expo-localization',
    'expo-font',
    'expo-dev-client',
    './modules/call-shield/app.plugin.js',
    '@bacons/apple-targets',
    ['expo-notifications', { color: '#0E5E5A' }],
    ['expo-camera', { cameraPermission: 'Η ΑΛΤ! χρειάζεται την κάμερα μόνο για να διαβάσει τον κωδικό σύνδεσης με την οικογένεια.' }],
    ['expo-contacts', { contactsPermission: 'Η ΑΛΤ! διαβάζει μόνο τις επαφές της οικογένειας που θα διαλέξεις.' }],
    ['expo-image-picker', { photosPermission: 'Η ΑΛΤ! ανοίγει μόνο τη φωτογραφία που θα διαλέξεις για έλεγχο.', cameraPermission: 'Η ΑΛΤ! χρειάζεται την κάμερα για να φωτογραφίσεις ένα μήνυμα ή γράμμα.' }],
    ['expo-speech-recognition', { microphonePermission: 'Η ΑΛΤ! ακούει μόνο όσο της μιλάς, για να ελέγξει τι σου είπαν.', speechRecognitionPermission: 'Η ΑΛΤ! μετατρέπει τη φωνή σου σε κείμενο για να το ελέγξει.', androidSpeechServicePackages: ['com.google.android.googlequicksearchbox', 'com.google.android.tts'] }],
    ['expo-audio', { microphonePermission: 'Η ΑΛΤ! ακούει μόνο όσο της μιλάς, για να ελέγξει τι σου είπαν.' }],
  ],
  experiments: { typedRoutes: true },
  extra: { webUrl, eas: { projectId: easProjectId } },
});
