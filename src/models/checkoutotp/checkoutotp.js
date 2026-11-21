
const mongoose = require("mongoose");

const checkoutOTPSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    otpHash: {
      type: String,
      required: true,
    },

    mobile: {
      type: String,
      default: "",
    },

    attempts: {
      type: Number,
      default: 0,
    },

    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },

    lastSentAt: {
      type: Date,
      default: Date.now,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One active OTP record per email
checkoutOTPSchema.index(
  { email: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "CheckoutOTP",
  checkoutOTPSchema
);
