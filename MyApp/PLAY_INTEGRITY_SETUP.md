# Android Play Integrity setup

Android signup now requires a Play Integrity token from the official app build. Configure both sides before releasing the app:

1. In Google Play Console, link the app to a Google Cloud project and enable the Play Integrity API.
2. Give the auth service's service account permission to decode Play Integrity tokens. Configure `ANDROID_PACKAGE_NAME=com.bharatplay.app` and `GOOGLE_PLAY_INTEGRITY_CREDENTIALS` on the auth service. The latter must contain the service-account JSON and must not be added to this repository or the app.
3. Set `EXPO_PUBLIC_PLAY_INTEGRITY_CLOUD_PROJECT_NUMBER` to the linked Google Cloud project number in the Android build environment.
4. Install the app dependencies, generate/rebuild the Android native project, and publish a new Android build. An Expo OTA update cannot add this native module to already-installed apps.
5. Test signup using a Play-distributed build. Development builds, sideloaded APKs, unsupported devices, or missing cloud configuration fail closed and cannot register.

The server validates the package name, one-time nonce, token age, recognized app/device verdicts, and rejects reused tokens. Play Integrity and browser private-mode checks are risk signals, not guarantees against every modified device, network, or browser implementation.

## Account binding by public IP

Authentication binds a public IP to the first account that successfully signs in from it, across web and app clients. This catches another browser on the same home/work network even when its browser storage and device cookie are new. Authentication fails when a verifiable public IP is unavailable. It is intentionally strict: other people sharing that public IP may be unable to sign in to a different account, and a device using another public IP cannot be recognized as the same physical computer by a website.
