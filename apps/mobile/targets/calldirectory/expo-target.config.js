/**
 * iOS Call Directory Extension: labels reported scam numbers ("⚠️ Πιθανή απάτη") and official numbers,
 * and blocks reported scams when the guardian chose "Block". The app writes the list into the shared App Group
 * (modules/call-shield/ios/CallShieldModule.swift) and asks iOS to reload this extension.
 * @type {import('@bacons/apple-targets/app.plugin').ConfigFunction}
 */
module.exports = (config) => ({
  type: 'call-directory',
  name: 'calldirectory',
  displayName: 'ΑΛΤ!',
  bundleIdentifier: '.calldirectory',
  deploymentTarget: '16.0',
  entitlements: {
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
