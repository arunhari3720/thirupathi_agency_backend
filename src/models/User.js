
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phoneNo: {
      type: String,
      trim: true,
      default: null,
    },

    // Retailer / Supermarket shop details
    shopName: {
      type: String,
      trim: true,
      default: null,
    },

    // Cloudinary profile image
    profilePic: {
      url: {
        type: String,
        default: null,
      },
      public_id: {
        type: String,
        default: null,
      },
    },

    password: {
      type: String,
      select: false,
    },

    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },

    userType: {
      type: String,
      enum: ["user", "retailer", "supermarket", "customer", "master"],
      default: "user",
    },

    provider: {
      type: String,
      enum: ["email", "google"],
      default: "email",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
