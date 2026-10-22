# Android Play Integrity setup

Android signup now requires a Play Integrity token from the official app build. Configure both sides before releasing the app:

1. In Google Play Console, link the app to a Google Cloud project and enable the Play Integrity API.
2. Give the auth service's service account permission to decode Play Integrity tokens. Configure `ANDROID_PACKAGE_NAME=com.bharatplay.app` and `GOOGLE_PLAY_INTEGRITY_CREDENTIALS` on the auth service. The latter must contain the service-account JSON and must not be added to this repository or the app.
3. Set `EXPO_PUBLIC_PLAY_INTEGRITY_CLOUD_PROJECT_NUMBER` to the linked Google Cloud project number in the Android build environment.
4. Install the app dependencies, generate/rebuild the Android native project, and publish a new Android build. An Expo OTA update cannot add this native module to already-installed apps.
5. Test signup using a Play-distributed build. Development builds, sideloaded APKs, unsupported devices, or missing cloud configuration fail closed and cannot register.

The server validates the package name, one-time nonce, token age, recognized app/device verdicts, and rejects reused tokens. Play Integrity and browser private-mode checks are risk signals, not guarantees against every modified device, network, or browser implementation.

## Account binding by public IP

Registration checks and claims the first account for a public IP across web and app clients. A second account cannot be registered from the same network. Existing users can sign in from shared networks even if another account is already associated with that public IP, so logging out and back in is not blocked by the registration restriction. During local development, loopback requests share a local binding so localhost testing follows the same one-account registration rule; production still requires a verifiable public IP for registration. A device using another public IP cannot be recognized as the same physical computer by a website.
