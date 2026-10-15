// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // House style uses Array<T> for complex element types.
    rules: { '@typescript-eslint/array-type': 'off', 'import/no-named-as-default-member': 'off' },
  },
  {
    ignores: ['dist/*', 'android/*', 'ios/*', 'modules/call-shield/logic/build/*', '.expo/*'],
  },
]);
