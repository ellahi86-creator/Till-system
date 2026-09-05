# Android test build

This source is configured in **TEST MODE**:

- Production login/catalogue/stock reads: enabled.
- Production order writes: disabled.
- Confirm Order: completes locally with a generated `TEST-xxxxxx` order number.
- Epson printer IP can be entered in the sales screen, but native printing remains blocked until the Epson Android native module is restored.
- Case -> screen protector upsell is enabled.

## Build requirements

The repository needs a normal React Native 0.81 Android shell (`android/`, Gradle wrapper, Metro config, entrypoint) plus Android SDK/build-tools. In a network-enabled development machine, create the shell with React Native 0.81, copy this application's `App.tsx` and `src/` into it, install dependencies, then run `./gradlew assembleDebug` from `android/`.

The current execution container does not contain Android SDK/build-tools and has no DNS/network access to download them, so an APK cannot be compiled inside this container.
