
// const mongoose = require("mongoose");

// const orderItemSchema = new mongoose.Schema(
//   {
//     productId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Product",
//       required: true,
//     },
//     productName: {
//       type: String,
//       required: true,
//     },
//     productCode: {
//       type: String,
//       required: true,
//     },
//     price: {
//       type: Number,
//       required: true,
//     },
//     qty: {
//       type: Number,
//       required: true,
//       min: 1,
//     },
//     image: {
//       url: String,
//       public_id: String,
//     },
//     subtotal: {
//       type: Number,
//       required: true,
//     },
//   },
//   { _id: false }
// );

// const orderSchema = new mongoose.Schema(
//   {
//     orderId: {
//       type: String,
//       unique: true,
//       required: true,
//     },
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     items: {
//       type: [orderItemSchema],
//       required: true,
//     },
//     totalAmount: {
//       type: Number,
//       required: true,
//     },
//     totalItems: {
//       type: Number,
//       required: true,
//     },
//     orderStatus: {
//       type: String,
//       enum: [
//         "pending",
//         "confirmed",
//         "processing",
//         "shipped",
//         "delivered",
//         "cancelled",
//       ],
//       default: "pending",
//     },
//     paymentStatus: {
//       type: String,
//       enum: ["pending", "paid", "failed", "refunded"],
//       default: "pending",
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Order", orderSchema);

const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productName: {
      type: String,
      required: true,
    },

    productCode: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    qty: {
      type: Number,
      required: true,
      min: 1,
    },

    image: {
      url: String,
      public_id: String,
    },

    subtotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const orderAddressSchema = new mongoose.Schema(
  {
    addressLine: String,
    city: String,
    district: String,
    state: String,
    pincode: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
    },

    // Registered customer
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Guest customer
    guestCustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GuestCustomer",
      default: null,
    },

    // Delivery details snapshot
    customerDetails: {
      name: {
        type: String,
        required: true,
      },

      email: {
        type: String,
        required: true,
      },

      mobile: {
        type: String,
        required: true,
      },

      shopName: {
        type: String,
        default: "",
      },

      address: {
        type: orderAddressSchema,
        required: true,
      },
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    totalItems: {
      type: Number,
      required: true,
    },

    orderType: {
      type: String,
      enum: ["whatsapp"],
      default: "whatsapp",
    },

    whatsappStatus: {
      type: String,
      enum: ["pending", "confirmed"],
      default: "pending",
    },

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Exactly one customer reference must be present.
orderSchema.pre("validate", function () {
  const hasUser = !!this.userId;
  const hasGuest = !!this.guestCustomerId;

  if (hasUser === hasGuest) {
    throw new Error(
      "Order must belong to either User or GuestCustomer"
    );
  }
});
module.exports = mongoose.model("Order", orderSchema);
