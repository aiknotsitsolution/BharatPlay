const axios = require("axios");
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const PhoneOtp = require("../models/PhoneOtp");
const User = require("../models/usermodel");
const RefreshToken = require("../models/RefreshToken");
const transporter = require("../Email/nodemailer");
const getLoginMailOptions = require("../Email/login");
const {
  signAccessToken,
  signRefreshToken,
  hashToken,
  REFRESH_TOKEN_TTL_MS,
} = require("../utils/tokenService");
const { resolveDeviceId } = require("../utils/deviceCookie");
const { setRefreshCookie } = require("../utils/refreshCookie");
const {
  registerOrVerifyDevice,
  requireAndroidSignupIntegrity,
} = require("../services/deviceSecurityService");
const {
  checkClientHardwareBinding,
  bindClientHardwareUuid,
} = require("../services/clientHardwareBindingService");
const { getClientIp } = require("../services/vpn.service/vpn.service");
const {
  evaluateSignupRequest,
  isSignupIpDuplicateError,
} = require("../services/signupPolicy");
const { claimIpAccountBinding } = require("../services/ipAccountBindingService");

const OTP_LIFETIME_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_WINDOW_MS = 60 * 60 * 1000;
const MAX_OTP_SENDS_PER_HOUR = 5;
const MAX_OTP_ATTEMPTS = 5;

const normalizeIndianPhone = (value) => {
  if (typeof value !== "string") return "";
  const digits = value.replace(/[\s()-]/g, "");
  if (/^\d{10}$/.test(digits)) return `+91${digits}`;
  if (/^91\d{10}$/.test(digits)) return `+${digits}`;
  if (/^\+91\d{10}$/.test(digits)) return digits;
  return "";
};

const otpHash = (subject, purpose, otp) =>
  crypto
    .createHmac(
      "sha256",
      process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || "",
    )
    .update(`${subject}:${purpose}:${otp}`)
    .digest("hex");

const issueCode = () => crypto.randomInt(100000, 1000000).toString();

const ensurePhoneProvider = () => {
  if (!process.env.MSG91_AUTH_KEY || !process.env.MSG91_TEMPLATE_ID) {
    const error = new Error("SMS verification service is not configured");
    error.statusCode = 503;
    throw error;
  }
};

const sendSmsOtp = async (phone, otp) => {
  ensurePhoneProvider();
  let response;
  try {
    response = await axios.post(
      "https://control.msg91.com/api/v5/otp",
      { OTP: otp },
      {
        params: {
          template_id: process.env.MSG91_TEMPLATE_ID,
          mobile: phone.replace("+", ""),
          authkey: process.env.MSG91_AUTH_KEY,
          otp_length: 6,
          otp_expiry: 5,
        },
        timeout: 10000,
      },
    );
  } catch (error) {
    error.statusCode = 502;
    throw error;
  }
  if (response.data?.type !== "success") {
    const error = new Error("MSG91 rejected the OTP request");
    error.statusCode = 502;
    error.response = {
      status: response.status,
      data: response.data,
    };
    throw error;
  }
  console.info("MSG91 accepted an OTP request", {
    requestId: response.data?.request_id || null,
  });
};

const reserveAndSendCode = async ({
  subject,
  purpose,
  userId,
  channel,
  metadata = null,
}) => {
  const now = new Date();
  const existing = await PhoneOtp.findOne({ subject, purpose });

  if (existing && existing.lastSentAt.getTime() > now.getTime() - OTP_COOLDOWN_MS) {
    const error = new Error("Please wait 60 seconds before requesting another code");
    error.statusCode = 429;
    throw error;
  }

  const inWindow =
    existing &&
    existing.sendWindowStartedAt.getTime() > now.getTime() - OTP_WINDOW_MS;
  if (inWindow && existing.sendsInWindow >= MAX_OTP_SENDS_PER_HOUR) {
    const error = new Error("OTP resend limit reached. Try again in an hour.");
    error.statusCode = 429;
    throw error;
  }

  const code = issueCode();
  const reservation = {
    subject,
    purpose,
    userId: userId || null,
    otpHash: otpHash(subject, purpose, code),
    expiresAt: new Date(now.getTime() + OTP_LIFETIME_MS),
    attempts: 0,
    lastSentAt: now,
    metadata,
    ...(inWindow
      ? { sendsInWindow: existing.sendsInWindow + 1 }
      : { sendsInWindow: 1, sendWindowStartedAt: now }),
  };

  if (existing) {
    const result = await PhoneOtp.updateOne(
      { _id: existing._id, lastSentAt: existing.lastSentAt },
      { $set: reservation },
    );
    if (!result.modifiedCount) {
      const error = new Error("An OTP request is already being processed");
      error.statusCode = 429;
      throw error;
    }
  } else {
    try {
      await PhoneOtp.create(reservation);
    } catch (error) {
      if (error.code === 11000) {
        const resendError = new Error("An OTP request is already being processed");
        resendError.statusCode = 429;
        throw resendError;
      }
      throw error;
    }
  }

  try {
    if (channel === "sms") {
      await sendSmsOtp(subject, code);
    } else {
      if (!transporter?.sendMail) {
        const error = new Error("Email verification service is not configured");
        error.statusCode = 503;
        throw error;
      }
      const delivery = await transporter.sendMail(
        getLoginMailOptions(subject, "BharatPlay user", code),
      );
      if (!delivery?.accepted?.length) {
        throw new Error("SMTP provider did not accept the verification email");
      }
      console.info("SMTP accepted a verification email", {
        messageId: delivery.messageId || null,
        acceptedRecipients: delivery.accepted.length,
        rejectedRecipients: delivery.rejected?.length || 0,
      });
    }
  } catch (error) {
    try {
      await PhoneOtp.updateOne(
        { subject, purpose, lastSentAt: now },
        { $set: { otpHash: "" } },
      );
    } catch (cleanupError) {
      console.error("Could not invalidate undelivered OTP:", cleanupError.message);
    }
    throw error;
  }
};

const verifyCode = async ({ subject, purpose, code }) => {
  const record = await PhoneOtp.findOne({ subject, purpose }).select("+otpHash");
  if (!record || record.expiresAt.getTime() < Date.now()) {
    await PhoneOtp.deleteOne({ subject, purpose });
    return { ok: false, message: "Verification code expired. Request a new one." };
  }
  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await PhoneOtp.deleteOne({ _id: record._id });
    return { ok: false, message: "Too many incorrect codes. Request a new one." };
  }

  const expected = Buffer.from(record.otpHash, "hex");
  const actual = Buffer.from(otpHash(subject, purpose, code), "hex");
  if (
    expected.length !== actual.length ||
    !crypto.timingSafeEqual(expected, actual)
  ) {
    await PhoneOtp.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
    return { ok: false, message: "Invalid verification code." };
  }
  return { ok: true, record };
};

const createUserSession = async (res, user, deviceId) => {
  const token = signAccessToken({
    userId: user._id,
    role: user.role,
    deviceId,
  });
  const refreshToken = signRefreshToken({
    sub: String(user._id),
    kind: "user",
  });
  await RefreshToken.create({
    userId: user._id,
    kind: "user",
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  setRefreshCookie(res, refreshToken, "user");
  return {
    success: true,
    token,
    needsEmailBinding: user.emailVerified !== true,
    user: {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.emailVerified ? user.email : null,
      phone: user.phone,
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified === true,
      role: user.role,
      avatar: user.avatar || null,
    },
  };
};

const checkDevice = async (req, res, userId) => {
  const binding = await checkClientHardwareBinding({
    clientHardwareUuid: req.body.clientHardwareUuid,
    userId,
  });
  if (!binding.ok) return binding;

  const device = await registerOrVerifyDevice({ req, userId });
  if (!device.ok) return device;

  if (userId) {
    const hardwareBinding = await bindClientHardwareUuid({
      clientHardwareUuid: binding.clientHardwareUuid,
      userId,
    });
    if (!hardwareBinding.ok) return hardwareBinding;
  }
  return { ok: true, deviceId: device.deviceId || resolveDeviceId(req, res) };
};

const sendError = (res, error, fallback) => {
  if (error.response) {
    console.error("OTP provider request failed:", {
      status: error.response.status,
      providerType: error.response.data?.type || null,
      providerMessage: error.response.data?.message || null,
    });
  } else {
    console.error("OTP request failed:", error.message);
  }
  return res.status(error.statusCode || 500).json({
    success: false,
    message:
      error.statusCode === 503
        ? error.message
        : error.statusCode === 429
          ? error.message
          : error.statusCode === 502
            ? "SMS provider could not accept the OTP request. Please try again later."
            : fallback,
  });
};

exports.requestPhoneOtp = async (req, res) => {
  try {
    const phone = normalizeIndianPhone(req.body?.phone);
    const intent = req.body?.intent === "signup" ? "signup" : "login";
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit Indian mobile number",
      });
    }
    if (intent === "signup" && !String(req.body?.name || "").trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    const user = await User.findOne({ phone, phoneVerified: true });
    if (intent === "login" && !user) {
      return res.status(404).json({
        success: false,
        code: "ACCOUNT_NOT_FOUND",
        message: "No account found for this number. Please sign up or migrate your existing account.",
      });
    }
    if (intent === "signup" && user) {
      return res.status(409).json({
        success: false,
        code: "PHONE_ALREADY_REGISTERED",
        message: "This mobile number is already registered. Please log in.",
      });
    }
    let signupCheck = null;
    if (intent === "signup") {
      signupCheck = await evaluateSignupRequest(req);
      if (!signupCheck.ok) {
        return res.status(signupCheck.status).json({
          success: false,
          code: signupCheck.code,
          message: signupCheck.message,
        });
      }
      const integrityCheck = await requireAndroidSignupIntegrity(req);
      if (!integrityCheck.ok) {
        return res.status(integrityCheck.status).json({
          success: false,
          code: integrityCheck.code,
          message: integrityCheck.message,
        });
      }
    }
    const deviceCheck = await checkDevice(req, res, user?._id || null);
    if (!deviceCheck.ok) {
      return res.status(deviceCheck.status).json({
        success: false,
        code: deviceCheck.code,
        message: deviceCheck.message,
      });
    }
    await reserveAndSendCode({
      subject: phone,
      purpose: intent,
      userId: user?._id,
      channel: "sms",
      metadata:
        intent === "signup"
          ? { name: String(req.body.name).trim() }
          : null,
    });
    return res.status(200).json({
      success: true,
      requiresOtp: true,
      message: "OTP sent to your mobile number.",
      retryAfterSeconds: 60,
    });
  } catch (error) {
    return sendError(res, error, "Could not send OTP. Please try again.");
  }
};

exports.verifyPhoneOtp = async (req, res) => {
  try {
    const phone = normalizeIndianPhone(req.body?.phone);
    const code = String(req.body?.otp || "").trim();
    const intent = req.body?.intent === "signup" ? "signup" : "login";
    if (!phone || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: "A valid Indian mobile number and six-digit OTP are required.",
      });
    }

    let signupCheck = null;
    if (intent === "signup") {
      signupCheck = await evaluateSignupRequest(req);
      if (!signupCheck.ok) {
        return res.status(signupCheck.status).json({
          success: false,
          code: signupCheck.code,
          message: signupCheck.message,
        });
      }
      const integrityCheck = await requireAndroidSignupIntegrity(req);
      if (!integrityCheck.ok) {
        return res.status(integrityCheck.status).json({
          success: false,
          code: integrityCheck.code,
          message: integrityCheck.message,
        });
      }
    }

    const verified = await verifyCode({ subject: phone, purpose: intent, code });
    if (!verified.ok) {
      return res.status(401).json({ success: false, message: verified.message });
    }

    let user = await User.findOne({ phone, phoneVerified: true });
    if (intent === "signup") {
      if (user) {
        await PhoneOtp.deleteOne({ _id: verified.record._id });
        return res.status(409).json({
          success: false,
          message: "This mobile number is already registered. Please log in.",
        });
      }
      const deviceBinding = await checkClientHardwareBinding({
        clientHardwareUuid: req.body.clientHardwareUuid,
        userId: null,
      });
      if (!deviceBinding.ok) {
        return res.status(deviceBinding.status).json({
          success: false,
          code: deviceBinding.code,
          message: deviceBinding.message,
        });
      }
      const deviceCheck = await registerOrVerifyDevice({ req });
      if (!deviceCheck.ok) {
        return res.status(deviceCheck.status).json({
          success: false,
          code: deviceCheck.code,
          message: deviceCheck.message,
        });
      }
      const emailPlaceholder = `phone-${phone.replace(/\D/g, "")}@phone.bharatplay.invalid`;
      user = await User.create({
        name: String(verified.record.metadata?.name || req.body?.name || "").trim(),
        email: emailPlaceholder,
        emailVerified: false,
        password: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12),
        phone,
        phoneVerified: true,
        ipAddress: signupCheck.ip,
        signupIpHash: signupCheck.ipHash,
        deviceId: deviceCheck.deviceId || resolveDeviceId(req, res),
        platform: req.headers["x-client-platform"] === "app" ? "app" : "website",
      });
      const deviceOwnerCheck = await registerOrVerifyDevice({
        req,
        userId: user._id,
      });
      if (!deviceOwnerCheck.ok) {
        await User.deleteOne({ _id: user._id });
        return res.status(deviceOwnerCheck.status).json({
          success: false,
          code: deviceOwnerCheck.code,
          message: deviceOwnerCheck.message,
        });
      }
      const hardwareBinding = await bindClientHardwareUuid({
        clientHardwareUuid: deviceBinding.clientHardwareUuid,
        userId: user._id,
      });
      if (!hardwareBinding.ok) {
        await User.deleteOne({ _id: user._id });
        return res.status(hardwareBinding.status).json({
          success: false,
          code: hardwareBinding.code,
          message: hardwareBinding.message,
        });
      }
      const ipBinding = await claimIpAccountBinding(req, user._id);
      if (!ipBinding.ok) {
        await User.deleteOne({ _id: user._id });
        return res.status(ipBinding.status).json({
          success: false,
          code: ipBinding.code,
          message: ipBinding.message,
        });
      }
    } else {
      user = await User.findOne({ phone, phoneVerified: true });
      if (!user) {
        await PhoneOtp.deleteOne({ _id: verified.record._id });
        return res.status(404).json({
          success: false,
          message: "Account not found. Please sign up or migrate your account.",
        });
      }
      const deviceCheck = await checkDevice(req, res, user._id);
      if (!deviceCheck.ok) {
        return res.status(deviceCheck.status).json({
          success: false,
          code: deviceCheck.code,
          message: deviceCheck.message,
        });
      }
      user.deviceId = deviceCheck.deviceId || user.deviceId;
      await user.save();
    }

    await PhoneOtp.deleteOne({ _id: verified.record._id });
    const response = await createUserSession(
      res,
      user,
      user.deviceId || resolveDeviceId(req, res),
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error("Phone OTP verification failed:", error);
    if (isSignupIpDuplicateError(error)) {
      return res.status(409).json({
        success: false,
        code: "SIGNUP_IP_ALREADY_USED",
        message: "Only one account can be registered from the same public IP address.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Could not verify OTP. Please try again.",
    });
  }
};

exports.requestEmailBindingOtp = async (req, res) => {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address." });
    }
    const exists = await User.findOne({ email, _id: { $ne: req.user.id } })
      .select("_id")
      .lean();
    if (exists) {
      return res.status(409).json({ success: false, message: "Email is already in use." });
    }
    await reserveAndSendCode({
      subject: email,
      purpose: "email-binding",
      userId: req.user.id,
      channel: "email",
    });
    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email.",
      retryAfterSeconds: 60,
    });
  } catch (error) {
    return sendError(res, error, "Could not send email verification code.");
  }
};

exports.verifyEmailBindingOtp = async (req, res) => {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const code = String(req.body?.otp || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: "A valid email and six-digit verification code are required.",
      });
    }
    const verified = await verifyCode({
      subject: email,
      purpose: "email-binding",
      code,
    });
    if (!verified.ok || String(verified.record?.userId) !== String(req.user.id)) {
      return res.status(401).json({
        success: false,
        message: verified.message || "Invalid verification session.",
      });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { email, emailVerified: true } },
      { new: true, runValidators: true },
    ).select("-password");
    await PhoneOtp.deleteOne({ _id: verified.record._id });
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Email binding verification failed:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already in use.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Could not verify email address.",
    });
  }
};

exports.requestPhoneBindingOtp = async (req, res) => {
  try {
    const phone = normalizeIndianPhone(req.body?.phone);
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit Indian mobile number",
      });
    }
    const existing = await User.findOne({
      phone,
      phoneVerified: true,
      _id: { $ne: req.user.id },
    })
      .select("_id")
      .lean();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This mobile number is already linked to another account.",
      });
    }
    await reserveAndSendCode({
      subject: phone,
      purpose: "profile-phone",
      userId: req.user.id,
      channel: "sms",
    });
    return res.status(200).json({
      success: true,
      message: "OTP sent to your mobile number.",
      retryAfterSeconds: 60,
    });
  } catch (error) {
    return sendError(res, error, "Could not send OTP. Please try again.");
  }
};

exports.verifyPhoneBindingOtp = async (req, res) => {
  try {
    const phone = normalizeIndianPhone(req.body?.phone);
    const code = String(req.body?.otp || "").trim();
    if (!phone || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: "A valid Indian mobile number and six-digit OTP are required.",
      });
    }
    const verified = await verifyCode({
      subject: phone,
      purpose: "profile-phone",
      code,
    });
    if (!verified.ok || String(verified.record?.userId) !== String(req.user.id)) {
      return res.status(401).json({
        success: false,
        message: verified.message || "Invalid verification session.",
      });
    }
    const conflict = await User.findOne({
      phone,
      phoneVerified: true,
      _id: { $ne: req.user.id },
    })
      .select("_id")
      .lean();
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "This mobile number is already linked to another account.",
      });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { phone, phoneVerified: true } },
      { new: true, runValidators: true },
    ).select("-password");
    await PhoneOtp.deleteOne({ _id: verified.record._id });
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Phone binding verification failed:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This mobile number is already linked to another account.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Could not verify mobile number.",
    });
  }
};

exports.startLegacyMigration = async (req, res) => {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password = String(req.body?.password || "");
    const phone = normalizeIndianPhone(req.body?.phone);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "Enter your existing email, password, and a valid Indian mobile number.",
      });
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid existing account credentials.",
      });
    }
    if (user.phoneVerified) {
      return res.status(409).json({
        success: false,
        message: "This account has already been migrated. Sign in with mobile OTP.",
      });
    }
    const existingPhone = await User.findOne({
      phone,
      phoneVerified: true,
      _id: { $ne: user._id },
    })
      .select("_id")
      .lean();
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "This mobile number is already linked to another account.",
      });
    }

    await reserveAndSendCode({
      subject: email,
      purpose: "legacy-email",
      userId: user._id,
      channel: "email",
    });
    await reserveAndSendCode({
      subject: phone,
      purpose: "legacy-phone",
      userId: user._id,
      channel: "sms",
    });
    return res.status(200).json({
      success: true,
      requiresOtp: true,
      message: "Verification codes sent to your existing email and new mobile number.",
      retryAfterSeconds: 60,
    });
  } catch (error) {
    return sendError(res, error, "Could not start account migration.");
  }
};

exports.verifyLegacyMigration = async (req, res) => {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const phone = normalizeIndianPhone(req.body?.phone);
    const emailOtp = String(req.body?.emailOtp || "").trim();
    const phoneOtp = String(req.body?.phoneOtp || "").trim();
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !phone ||
      !/^\d{6}$/.test(emailOtp) ||
      !/^\d{6}$/.test(phoneOtp)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter both six-digit verification codes.",
      });
    }
    const [verifiedEmail, verifiedPhone] = await Promise.all([
      verifyCode({ subject: email, purpose: "legacy-email", code: emailOtp }),
      verifyCode({ subject: phone, purpose: "legacy-phone", code: phoneOtp }),
    ]);
    if (!verifiedEmail.ok || !verifiedPhone.ok) {
      return res.status(401).json({
        success: false,
        message:
          !verifiedEmail.ok
            ? `Email: ${verifiedEmail.message}`
            : `Mobile: ${verifiedPhone.message}`,
      });
    }
    if (
      !verifiedEmail.record.userId ||
      String(verifiedEmail.record.userId) !== String(verifiedPhone.record.userId)
    ) {
      return res.status(401).json({
        success: false,
        message: "The verification codes do not match this account.",
      });
    }
    const user = await User.findOne({
      _id: verifiedEmail.record.userId,
      email,
      phoneVerified: { $ne: true },
    });
    if (!user) {
      return res.status(409).json({
        success: false,
        message: "This account is no longer eligible for migration.",
      });
    }
    const device = await checkDevice(req, res, user._id);
    if (!device.ok) {
      return res.status(device.status).json({
        success: false,
        code: device.code,
        message: device.message,
      });
    }
    user.phone = phone;
    user.phoneVerified = true;
    user.emailVerified = true;
    user.deviceId = device.deviceId || user.deviceId;
    await user.save();
    await PhoneOtp.deleteMany({
      $or: [
        { subject: email, purpose: "legacy-email" },
        { subject: phone, purpose: "legacy-phone" },
      ],
    });
    return res.status(200).json(
      await createUserSession(res, user, user.deviceId || resolveDeviceId(req, res)),
    );
  } catch (error) {
    console.error("Legacy account migration failed:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This mobile number is already linked to another account.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Could not migrate account.",
    });
  }
};
