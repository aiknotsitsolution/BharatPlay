import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { requestIntegrityToken } from "expo-play-integrity";

export const getSignupIntegrityProof = async () => {
  if (Platform.OS !== "android") return {};

  const cloudProjectNumber = Number(
    Constants.expoConfig?.extra?.playIntegrityCloudProjectNumber ??
      process.env.EXPO_PUBLIC_PLAY_INTEGRITY_CLOUD_PROJECT_NUMBER,
  );
  if (!Number.isSafeInteger(cloudProjectNumber) || cloudProjectNumber <= 0) {
    throw new Error(
      "Android signup security is not configured. Please update the app and try again later.",
    );
  }

  const integrityNonce = Crypto.randomUUID();
  let playIntegrityToken: string;
  try {
    playIntegrityToken = await requestIntegrityToken(
      cloudProjectNumber,
      integrityNonce,
    );
  } catch (error) {
    console.error("Could not request Android Play Integrity proof:", error);
    throw new Error(
      "This Android app version cannot complete secure registration. Update the app and try again.",
    );
  }

  return { integrityNonce, playIntegrityToken };
};
