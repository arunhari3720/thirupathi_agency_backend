
const User = require("../../models/User");
const OtpVerification = require("../../models/otpverfication/otpverification");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const {
  cloudinary,
  isCloudinaryConfigured,
} = require("../../config/cloudinary");
const sendOtpEmail = require("../../../utils/emailsservice/otpemailservice");

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

// ======================================
// COMMON HELPERS
// ======================================

const allowedUserTypes = [
  "user",
  "retailer",
  "supermarket",
  "customer",
];

const shopUserTypes = ["retailer", "supermarket"];

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      userType: user.userType,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const getUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phoneNo: user.phoneNo,
  shopName: user.shopName || null,
  profilePic: user.profilePic || {
    url: null,
    public_id: null,
  },
  userType: user.userType,
  provider: user.provider,
});

const normalizeShopName = (userType, shopName) => {
  if (!shopUserTypes.includes(userType)) {
    return null;
  }

  return typeof shopName === "string"
    ? shopName.trim() || null
    : null;
};

// ======================================
// OTP HELPERS
// ======================================

const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const hashOtp = (email, purpose, otp) => {
  return crypto
    .createHash("sha256")
    .update(
      `${email}:${purpose}:${otp}:${process.env.JWT_SECRET}`
    )
    .digest("hex");
};

const compareHash = (value1, value2) => {
  const a = Buffer.from(value1, "hex");
  const b = Buffer.from(value2, "hex");

  return (
    a.length === b.length &&
    crypto.timingSafeEqual(a, b)
  );
};

// Send OTP through Brevo email service
const sendVerificationOtp = async ({
  email,
  name,
  purpose,
  payload = null,
}) => {
  const existing = await OtpVerification.findOne({
    email,
    purpose,
  });

  // 60 seconds resend cooldown
  if (
    existing &&
    Date.now() - existing.lastSentAt.getTime() < 60000
  ) {
    const error = new Error(
      "Please wait 60 seconds before requesting another OTP."
    );

    error.statusCode = 429;
    throw error;
  }

  const otp = generateOtp();
  const otpHash = hashOtp(email, purpose, otp);

  await OtpVerification.findOneAndUpdate(
    { email, purpose },
    {
      $set: {
        otpHash,
        payload,
        attempts: 0,
        lastSentAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        verifiedAt: null,
        resetTokenHash: null,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  try {
    await sendOtpEmail({
      email,
      name,
      otp,
      purpose,
    });
  } catch (error) {
    await OtpVerification.deleteOne({
      email,
      purpose,
      otpHash,
    });

    throw error;
  }
};

// Verify OTP
const verifyOtpRecord = async ({
  email,
  purpose,
  otp,
}) => {
  if (!/^\d{6}$/.test(String(otp))) {
    throw new Error("Please enter a valid 6 digit OTP.");
  }

  const record = await OtpVerification.findOne({
    email,
    purpose,
  });

  if (!record || record.expiresAt <= new Date()) {
    throw new Error(
      "OTP expired or invalid. Please request a new OTP."
    );
  }

  if (record.verifiedAt) {
    throw new Error("OTP already verified.");
  }

  if (record.attempts >= 5) {
    await OtpVerification.deleteOne({
      _id: record._id,
    });

    throw new Error(
      "Maximum OTP attempts exceeded. Please request a new OTP."
    );
  }

  const incomingHash = hashOtp(
    email,
    purpose,
    String(otp)
  );

  if (!compareHash(record.otpHash, incomingHash)) {
    record.attempts += 1;
    await record.save();

    throw new Error("Invalid OTP.");
  }

  return record;
};

// ======================================
// REGISTER - SEND OTP
// ======================================

exports.sendRegistrationOtp = async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNo,
      password,
      userType,
      shopName,
    } = req.body;

    if (!name || !email || !phoneNo || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, phone number and password are required.",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUserType = userType || "user";

    if (!allowedUserTypes.includes(normalizedUserType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user type.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const registrationPayload = {
      name: name.trim(),
      phoneNo: phoneNo.trim(),
      password: hashedPassword,
      userType: normalizedUserType,
      shopName: normalizeShopName(
        normalizedUserType,
        shopName
      ),
      provider: "email",
    };

    await sendVerificationOtp({
      email: normalizedEmail,
      name: name.trim(),
      purpose: "register",
      payload: registrationPayload,
    });

    return res.status(200).json({
      success: true,
      message: "Registration OTP sent successfully.",
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("Registration OTP Error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message || "Unable to send registration OTP.",
    });
  }
};

// Existing route compatibility
exports.register = exports.sendRegistrationOtp;

// ======================================
// REGISTER - VERIFY OTP
// ======================================

exports.verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const otpRecord = await verifyOtpRecord({
      email: normalizedEmail,
      purpose: "register",
      otp,
    });

    const registration = otpRecord.payload;

    if (!registration) {
      return res.status(400).json({
        success: false,
        message:
          "Registration details not found. Please register again.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      await OtpVerification.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    const user = await User.create({
      name: registration.name,
      email: normalizedEmail,
      phoneNo: registration.phoneNo,
      password: registration.password,
      userType: registration.userType,
      shopName: normalizeShopName(
        registration.userType,
        registration.shopName
      ),
      provider: "email",
    });

    await OtpVerification.deleteOne({
      _id: otpRecord._id,
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Email verified and registration successful.",
      token,
      user: getUserResponse(user),
    });
  } catch (error) {
    console.error("Registration Verification Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "OTP verification failed.",
    });
  }
};

// ======================================
// LOGIN
// ======================================

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: getUserResponse(user),
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
};

// ======================================
// GOOGLE LOGIN
// ======================================

exports.googleLogin = async (req, res) => {
  try {
    const {
      credential,
      userType,
      phoneNo,
      shopName,
    } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required.",
      });
    }

    const selectedUserType = userType || "user";

    if (!allowedUserTypes.includes(selectedUserType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user type.",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (
      !payload ||
      !payload.email ||
      !payload.email_verified
    ) {
      return res.status(401).json({
        success: false,
        message: "Google account verification failed.",
      });
    }

    const {
      sub: googleId,
      name,
      email,
    } = payload;

    const normalizedEmail = email.trim().toLowerCase();

    let user = await User.findOne({
      $or: [
        { googleId },
        { email: normalizedEmail },
      ],
    });

    if (user) {
      // Link Google account to existing email account
      if (!user.googleId) {
        user.googleId = googleId;
      }

      if (!user.phoneNo && phoneNo) {
        user.phoneNo = phoneNo;
      }

      // Do not overwrite an existing account's type or shop name
      if (
        shopUserTypes.includes(user.userType) &&
        !user.shopName
      ) {
        user.shopName = normalizeShopName(
          user.userType,
          shopName
        );
      }

      await user.save();
    } else {
      user = await User.create({
        name: name || "Google User",
        email: normalizedEmail,
        googleId,
        phoneNo: phoneNo || null,
        userType: selectedUserType,
        shopName: normalizeShopName(
          selectedUserType,
          shopName
        ),
        provider: "google",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Google login successful.",
      token,
      user: getUserResponse(user),
    });
  } catch (error) {
    console.error("Google Login Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email is already linked to another account.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Google authentication failed.",
    });
  }
};

// ======================================
// FORGOT PASSWORD - SEND OTP
// ======================================

exports.sendForgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "This email address is not registered.",
      });
    }

    if (!user.password && user.provider === "google") {
      return res.status(400).json({
        success: false,
        message:
          "This account uses Google login. Please sign in with Google.",
      });
    }

    await sendVerificationOtp({
      email: normalizedEmail,
      name: user.name,
      purpose: "forgot_password",
      payload: null,
    });

    return res.status(200).json({
      success: true,
      message: "Password reset OTP sent successfully to your email.",
    });
  } catch (error) {
    console.error("Forgot Password OTP Error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message || "Unable to send OTP. Please try again.",
    });
  }
};

// ======================================
// FORGOT PASSWORD - VERIFY OTP
// ======================================

exports.verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const otpRecord = await verifyOtpRecord({
      email: normalizedEmail,
      purpose: "forgot_password",
      otp,
    });

    const resetToken = crypto.randomBytes(32).toString("hex");

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    otpRecord.verifiedAt = new Date();
    otpRecord.resetTokenHash = resetTokenHash;

    // Reset token valid for 10 minutes
    otpRecord.expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await otpRecord.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      resetToken,
    });
  } catch (error) {
    console.error("Forgot Password Verification Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "OTP verification failed.",
    });
  }
};

// ======================================
// RESET PASSWORD
// ======================================

exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required.",
      });
    }

    if (
      typeof newPassword !== "string" ||
      newPassword.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters.",
      });
    }

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const otpRecord = await OtpVerification.findOne({
      purpose: "forgot_password",
      resetTokenHash,
      verifiedAt: { $ne: null },
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token.",
      });
    }

    const user = await User.findOne({
      email: otpRecord.email,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    // Consume token only after successful password update
    await OtpVerification.deleteOne({
      _id: otpRecord._id,
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please login again.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password.",
    });
  }
};

// ======================================
// CLOUDINARY PROFILE IMAGE HELPER
// ======================================

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "thirupathi-agencies/profiles",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

// ======================================
// UPDATE USER PROFILE
// ======================================

exports.updateProfile = async (req, res) => {
  let uploadedImage = null;

  try {
    const userId = req.user.id;

    const {
      name,
      phoneNo,
      shopName,
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (
      name === undefined &&
      phoneNo === undefined &&
      shopName === undefined &&
      !req.file
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field to update.",
      });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty.",
        });
      }

      user.name = name.trim();
    }

    if (phoneNo !== undefined) {
      user.phoneNo =
        typeof phoneNo === "string" && phoneNo.trim()
          ? phoneNo.trim()
          : null;
    }

    if (shopName !== undefined) {
      if (shopUserTypes.includes(user.userType)) {
        user.shopName =
          typeof shopName === "string" && shopName.trim()
            ? shopName.trim()
            : null;
      } else {
        user.shopName = null;
      }
    }

    const oldPublicId = user.profilePic?.public_id;

    // Upload new image if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);

      uploadedImage = result;

      user.profilePic = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

    await user.save();

    // Delete old image only after new image and DB update succeed
    if (
      uploadedImage &&
      oldPublicId &&
      oldPublicId !== uploadedImage.public_id
    ) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (deleteError) {
        console.error(
          "Old profile image deletion failed:",
          deleteError.message
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: getUserResponse(user),
    });
  } catch (error) {
    console.error("Profile Update Error:", error);

    // Cleanup newly uploaded image if DB update failed
    if (uploadedImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(
          uploadedImage.public_id
        );
      } catch (deleteError) {
        console.error(
          "Cloudinary cleanup failed:",
          deleteError.message
        );
      }
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update profile.",
    });
  }
};
// Get Logged-in User Profile
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select(
      "-password -googleId -__v"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNo: user.phoneNo,
        userType: user.userType,
        provider: user.provider,
        shopName: user.shopName || null,
        profilePic: user.profilePic || {
          url: null,
          public_id: null,
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });

  } catch (error) {
    console.error("Get Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
    });
  }
};