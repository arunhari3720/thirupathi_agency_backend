
const express = require("express");

const router = express.Router();

const {
  sendGuestCheckoutOtp,
  verifyGuestCheckoutOtp,
  registerGuestCustomer,
} = require("../../controllers/guestusercontroller/guestusercontroller");

const {guestCheckoutAuth} = require(
  "../../middlewares/auth_middleware"
);

// Send OTP
router.post(
  "/send-otp",
  sendGuestCheckoutOtp
);

// Verify OTP
router.post(
  "/verify-otp",
  verifyGuestCheckoutOtp
);

// New guest customer registration
router.post(
  "/register",
  guestCheckoutAuth,
  registerGuestCustomer
);

module.exports = router;
