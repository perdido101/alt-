// Config plugin for the Call Shield module.
// Android: the library manifest (service, receiver, permissions) merges automatically; this plugin only
// lets an app drop the optional overlay permission ({ overlay: false }).
// iOS: adds the Call Directory extension (see plugins/withCallDirectory.js, milestone 6).
const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withCallShield(config, { overlay = true } = {}) {
  if (overlay) return config;
  return withAndroidManifest(config, (c) => {
    const manifest = c.modResults.manifest;
    manifest.$ = { ...manifest.$, 'xmlns:tools': 'http://schemas.android.com/tools' };
    manifest['uses-permission'] = [
      ...(manifest['uses-permission'] ?? []).filter((p) => p.$['android:name'] !== 'android.permission.SYSTEM_ALERT_WINDOW'),
      { $: { 'android:name': 'android.permission.SYSTEM_ALERT_WINDOW', 'tools:node': 'remove' } },
    ];
    return c;
  });
};
