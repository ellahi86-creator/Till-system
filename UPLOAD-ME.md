# Upload instructions

Upload the `.github` folder from this package into the root of your `Till-system` repository.

The workflow creates a fresh React Native 0.81 Android shell on GitHub's runner, overlays your existing `App.tsx` and `src/`, builds a debug APK, and publishes `Sell-Repair-POS-TEST.apk` as a GitHub Actions artifact.

Your current reconstruction remains in TEST MODE: production reads are enabled, while production order writes are disabled.
