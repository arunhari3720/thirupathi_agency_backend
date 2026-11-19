
const User = require("../../models/User");
const Cart = require("../../models/cart/cart");
const Order = require("../../models/order/order");
const Payment = require("../../models/payment/payment");

// GET - Logged-in User Complete Data
exports.getMyCompleteData = async (req, res) => {
  try {
    const userId = req.user.id;

    // User profile
    const user = await User.findById(userId).select(
      "-password -googleId -__v"
    ).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Cart
    const cart = await Cart.findOne({ userId })
      .populate(
        "items.productId",
        "productName productCode price qty image"
      )
      .lean();

    // Orders
    const orders = await Order.find({ userId })
      .populate(
        "items.productId",
        "productName productCode image"
      )
      .sort({ createdAt: -1 })
      .lean();

    // Payments
    const payments = await Payment.find({ userId })
      .select("-razorpaySignature")
      .populate(
        "items.productId",
        "productName productCode image"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "User data fetched successfully",

      user,

      cart: cart || {
        userId,
        items: [],
      },

      orders,

      payments,

      summary: {
        totalCartItems: cart?.items?.length || 0,
        totalOrders: orders.length,
        totalPayments: payments.length,
      },
    });

  } catch (error) {
    console.error("Get User Complete Data Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch user data",
    });
  }
};
