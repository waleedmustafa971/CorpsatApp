/**
 * Extends app.json at build time.
 *
 * The Google Maps key is injected from the environment rather than committed,
 * because this repo is public. Without it the app still builds and every
 * screen works — only the Android map tiles come up blank, since a standalone
 * build has no key of its own (Expo Go borrows Expo's).
 *
 * Set it locally with a .env.local file, or for cloud builds with:
 *   eas env:create --name GOOGLE_MAPS_API_KEY --value <key> --environment preview
 */
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra ?? {}),
    // FarmMap reads this at runtime. Android's Maps SDK throws a fatal
    // RuntimeException when the manifest has no API key, so a keyless build
    // must render the fallback rather than mount a MapView.
    googleMapsConfigured: Boolean(googleMapsApiKey),
  },
  plugins: [
    ...(config.plugins ?? []),
    ...(googleMapsApiKey
      ? [['react-native-maps', { androidGoogleMapsApiKey: googleMapsApiKey }]]
      : []),
  ],
});
