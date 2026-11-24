const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/usermodel");
const { deleteUserAccountData } = require("../services/accountDeletionService");

const getGoogleClientIds = () =>
  Array.from(
    new Set(
      [
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_WEB_CLIENT_ID,
        process.env.GOOGLE_ANDROID_CLIENT_ID,
        process.env.GOOGLE_IOS_CLIENT_ID,
      ]
        .map((clientId) => String(clientId || "").trim())
        .filter(Boolean),
    ),
  );

const verifyGoogleReauthentication = async (credential, user) => {
  const clientIds = getGoogleClientIds();
  if (!clientIds.length) {
    throw new Error("Google account verification is not configured.");
  }

  const ticket = await new OAuth2Client(clientIds[0]).verifyIdToken({
    idToken: credential,
    audience: clientIds,
  });
  const payload = ticket.getPayload();
  if (
    payload?.email_verified !== true ||
    payload.email?.trim().toLowerCase() !== user.email ||
    (user.googleId && payload.sub !== user.googleId)
  ) {
    return false;
  }
  return true;
};

exports.deleteMyAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "+password +googleId email",
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    const confirmedEmail =
      typeof req.body?.confirmEmail === "string"
        ? req.body.confirmEmail.trim().toLowerCase()
        : "";
    if (confirmedEmail !== user.email) {
      return res.status(400).json({
        success: false,
        message: "Enter the email address linked to your account.",
      });
    }

    const confirmations = req.body?.confirmations || {};
    if (
      confirmations.content !== true ||
      confirmations.account !== true ||
      confirmations.permanent !== true
    ) {
      return res.status(400).json({
        success: false,
        message: "Confirm all account deletion acknowledgements to continue.",
      });
    }

    const password =
      typeof req.body?.password === "string" ? req.body.password : "";
    const googleCredential =
      typeof req.body?.googleCredential === "string"
        ? req.body.googleCredential
        : "";
    let reauthenticated = false;

    if (googleCredential) {
      try {
        reauthenticated = await verifyGoogleReauthentication(
          googleCredential,
          user,
        );
      } catch {
        reauthenticated = false;
      }
    } else if (password && user.password) {
      reauthenticated = await bcrypt.compare(password, user.password);
    }

    if (!reauthenticated) {
      return res.status(401).json({
        success: false,
        message: "Verify your password or Google account to delete your account.",
      });
    }

    await deleteUserAccountData(user._id);
    return res.status(200).json({
      success: true,
      message: "Your account and associated content have been deleted.",
    });
  } catch (error) {
    console.error("[account-deletion] Account deletion failed:", error);
    return res.status(500).json({
      success: false,
      message:
        "Account deletion could not be completed. Please try again later.",
    });
  }
};
