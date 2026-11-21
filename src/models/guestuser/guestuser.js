
const mongoose = require("mongoose");

const guestAddressSchema = new mongoose.Schema(
  {
    addressLine: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    district: {
      type: String,
      default: "",
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const guestCustomerSchema = new mongoose.Schema(
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

    mobile: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    shopName: {
      type: String,
      default: "",
      trim: true,
    },

    addresses: {
      type: [guestAddressSchema],
      validate: {
        validator: (addresses) => addresses.length > 0,
        message: "At least one address is required",
      },
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    totalOrders: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "GuestCustomer",
  guestCustomerSchema
);
