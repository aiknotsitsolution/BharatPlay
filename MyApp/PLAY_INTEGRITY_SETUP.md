# Android Play Integrity setup

Android signup now requires a Play Integrity token from the official app build. Configure both sides before releasing the app:

1. In Google Play Console, link the app to a Google Cloud project and enable the Play Integrity API.
2. Give the auth service's service account permission to decode Play Integrity tokens. Configure `ANDROID_PACKAGE_NAME=com.bharatplay.app` and `GOOGLE_PLAY_INTEGRITY_CREDENTIALS` on the auth service. The latter must contain the service-account JSON and must not be added to this repository or the app.
3. Set `EXPO_PUBLIC_PLAY_INTEGRITY_CLOUD_PROJECT_NUMBER` to the linked Google Cloud project number in the Android build environment (EAS environment or local `MyApp/.env`). `app.config.js` embeds it in Expo `extra` for the native app. This project number is not a secret; never put the service-account JSON in the app.
4. Build and install a new Android app after adding `expo-play-integrity`, for example with `eas build --platform android --profile preview` or `npx expo run:android`. The app must be a native build that includes the module; Expo Go cannot provide it. An Expo OTA update cannot add this native module to an already-installed app.
5. Test signup using a Play-distributed build. Older builds without the module, unsupported devices, or missing cloud configuration fail closed and cannot register.

The server validates the package name, one-time nonce, token age, recognized app/device verdicts, and rejects reused tokens. Play Integrity and browser private-mode checks are risk signals, not guarantees against every modified device, network, or browser implementation.

## Account binding by public IP

Registration checks and claims the first account for a public IP across web and app clients, and each recognized device can register only one account. Existing users can sign in from shared networks even if another account is associated with that public IP, and logging out does not make a registered device available for another account. During local development, loopback requests share a local binding so localhost testing follows the same one-account registration rule; production still requires a verifiable public IP for registration. Browser device recognition uses a persistent server-issued cookie, so clearing browser data or switching browsers may create a new device identity.
