const express = require("express");
const router = express.Router();

const {
  register,
  verifyRegistrationOtp,
  login,
  googleLogin,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
  updateProfile,
  getMyProfile,
} = require("../../controllers/usercontroller/usercontroller");

const {
  verifyToken,
} = require("../../middlewares/auth_middleware");

const upload = require("../../middlewares/profileupload");

// Registration
router.post("/register", register);
router.post("/register/verify-otp", verifyRegistrationOtp);

// Login
router.post("/login", login);
router.post("/google-login", googleLogin);

// Forgot password
router.post(
  "/forgot-password/send-otp",
  sendForgotPasswordOtp
);

router.post(
  "/forgot-password/verify-otp",
  verifyForgotPasswordOtp
);

router.post(
  "/forgot-password/reset-password",
  resetPassword
);
router.get("/profile", verifyToken, getMyProfile);

// Update profile
router.put(
  "/profile",
  verifyToken,
  upload.single("profilePic"),
  updateProfile
);

module.exports = router;