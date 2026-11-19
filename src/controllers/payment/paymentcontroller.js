
const crypto = require("crypto");
const mongoose = require("mongoose");

const razorpay = require("../../config/razorpay");

const Cart = require("../../models/cart/cart");
const Order = require("../../models/order/order");
const Product = require("../../models/product/product");
const Payment = require("../../models/payment/payment");
const User = require("../../models/User");
const generateInvoice = require("../../../utils/generateinvoice");
const sendInvoiceEmail = require("../../../utils/emailsservice/emailservice")
// ======================================
// CREATE RAZORPAY ORDER
// ======================================

exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch cart using correct productId reference
    const cart = await Cart.findOne({ userId }).populate(
      "items.productId"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    const orderItems = [];
    let totalAmount = 0;
    let totalItems = 0;

    // Calculate amount using database prices
    for (const item of cart.items) {
      const product = item.productId;

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "One or more products are unavailable",
        });
      }

      if (product.qty < item.qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.productName}`,
        });
      }

      const price = Number(product.price);

      if (!Number.isFinite(price) || price <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid price for ${product.productName}`,
        });
      }

      const subtotal = price * item.qty;

      orderItems.push({
        productId: product._id,
        productName: product.productName,
        productCode: product.productCode,
        price,
        qty: item.qty,
        image: {
          url: product.image?.url || "",
          public_id: product.image?.public_id || "",
        },
        subtotal,
      });

      totalAmount += subtotal;
      totalItems += item.qty;
    }

    // Convert INR to paise
    const amountInPaise = Math.round(totalAmount * 100);

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    // Save payment and original cart snapshot
    await Payment.create({
      userId,
      amount: amountInPaise,
      currency: "INR",
      razorpayOrderId: razorpayOrder.id,
      items: orderItems,
      totalAmount,
      totalItems,
      status: "created",
    });

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });

  } catch (error) {
    console.error("Create Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order",
    });
  }
};


// ======================================
// VERIFY RAZORPAY PAYMENT
// ======================================

// exports.verifyPayment = async (req, res) => {
//   let session;

//   try {
//     const userId = req.user.id;

//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//     } = req.body || {};

//     if (
//       !razorpay_order_id ||
//       !razorpay_payment_id ||
//       !razorpay_signature
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment verification details are required",
//       });
//     }

//     // Find payment record
//     const payment = await Payment.findOne({
//       userId,
//       razorpayOrderId: razorpay_order_id,
//     });

//     if (!payment) {
//       return res.status(404).json({
//         success: false,
//         message: "Payment order not found",
//       });
//     }

//     // Prevent duplicate order creation
//     if (payment.status === "paid" && payment.orderId) {
//       return res.status(200).json({
//         success: true,
//         message: "Payment already verified",
//         orderId: payment.orderId,
//       });
//     }

//     // Generate expected signature
//     const body = `${razorpay_order_id}|${razorpay_payment_id}`;

//     const expectedSignature = crypto
//       .createHmac(
//         "sha256",
//         process.env.RAZORPAY_KEY_SECRET
//       )
//       .update(body)
//       .digest("hex");

//     // Compare signatures safely
//     const actualBuffer = Buffer.from(
//       razorpay_signature,
//       "hex"
//     );

//     const expectedBuffer = Buffer.from(
//       expectedSignature,
//       "hex"
//     );

//     if (
//       !/^[a-f0-9]{64}$/i.test(razorpay_signature) ||
//       actualBuffer.length !== expectedBuffer.length ||
//       !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid payment signature",
//       });
//     }

//     // Verify actual Razorpay payment
//     const razorpayPayment = await razorpay.payments.fetch(
//       razorpay_payment_id
//     );

//     if (
//       razorpayPayment.order_id !== payment.razorpayOrderId ||
//       razorpayPayment.amount !== payment.amount ||
//       razorpayPayment.currency !== payment.currency ||
//       razorpayPayment.status !== "captured"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment is not captured or payment details do not match",
//       });
//     }

//     // ======================================
//     // CREATE ORDER + REDUCE STOCK + CLEAR CART
//     // ======================================

//     session = await mongoose.startSession();

//     let createdOrder;

//     await session.withTransaction(async () => {

//       // Re-fetch payment inside transaction
//       const currentPayment = await Payment.findById(
//         payment._id
//       ).session(session);

//       if (
//         currentPayment.status === "paid" &&
//         currentPayment.orderId
//       ) {
//         createdOrder = await Order.findOne({
//           orderId: currentPayment.orderId,
//         }).session(session);

//         return;
//       }

//       // Build order using saved payment snapshot
//       const orderId = `ORD-${crypto.randomUUID()}`;

//       // Reduce product stock safely
//       for (const item of currentPayment.items) {
//         const stockUpdate = await Product.updateOne(
//           {
//             _id: item.productId,
//             qty: { $gte: item.qty },
//           },
//           {
//             $inc: { qty: -item.qty },
//           },
//           { session }
//         );

//         if (stockUpdate.modifiedCount !== 1) {
//           throw new Error(
//             `Stock unavailable for ${item.productName}. Payment captured; manual resolution required.`
//           );
//         }
//       }

//       // Create order
//       const [order] = await Order.create(
//         [
//           {
//             orderId,
//             userId,
//             items: currentPayment.items,
//             totalAmount: currentPayment.totalAmount,
//             totalItems: currentPayment.totalItems,
//             orderStatus: "confirmed",
//             paymentStatus: "paid",
//           },
//         ],
//         { session }
//       );

//       createdOrder = order;

//       // Clear cart only if it still matches the paid snapshot
//       const currentCart = await Cart.findOne({
//         userId,
//       }).session(session);

//       if (currentCart) {
//         const cartMatches = (
//           currentCart.items.length === currentPayment.items.length &&
//           currentCart.items.every((cartItem) => {
//             const paidItem = currentPayment.items.find(
//               (item) =>
//                 item.productId.toString() ===
//                 cartItem.productId.toString()
//             );

//             return paidItem && paidItem.qty === cartItem.qty;
//           })
//         );

//         if (cartMatches) {
//           currentCart.items = [];
//           await currentCart.save({ session });
//         }
//       }

//       // Update payment record
//       currentPayment.razorpayPaymentId =
//         razorpay_payment_id;

//       currentPayment.razorpaySignature =
//         razorpay_signature;

//       currentPayment.paymentMethod =
//         razorpayPayment.method;

//       currentPayment.status = "paid";
//       currentPayment.orderId = orderId;

//       await currentPayment.save({ session });
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Payment verified and order placed successfully",
//       order: createdOrder,
//     });

//   } catch (error) {
//     console.error("Verify Payment Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message || "Payment verification failed",
//     });

//   } finally {
//     if (session) {
//       await session.endSession();
//     }
//   }
// };

exports.verifyPayment = async (req, res) => {
  let session;

  try {
    const userId = req.user.id;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are required",
      });
    }

    // Find payment record
    const payment = await Payment.findOne({
      userId,
      razorpayOrderId: razorpay_order_id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment order not found",
      });
    }

    // Prevent duplicate order creation and duplicate email
    if (payment.status === "paid" && payment.orderId) {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        orderId: payment.orderId,
      });
    }

    // Generate expected signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    // Safely compare signatures
    const actualBuffer = Buffer.from(
      razorpay_signature,
      "hex"
    );

    const expectedBuffer = Buffer.from(
      expectedSignature,
      "hex"
    );

    if (
      !/^[a-f0-9]{64}$/i.test(razorpay_signature) ||
      actualBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Verify actual Razorpay payment
    const razorpayPayment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    if (
      razorpayPayment.order_id !== payment.razorpayOrderId ||
      razorpayPayment.amount !== payment.amount ||
      razorpayPayment.currency !== payment.currency ||
      razorpayPayment.status !== "captured"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment is not captured or payment details do not match",
      });
    }

    // ======================================
    // CREATE ORDER + REDUCE STOCK + CLEAR CART
    // ======================================

    session = await mongoose.startSession();

    let createdOrder;
    let shouldSendInvoiceEmail = false;

    await session.withTransaction(async () => {

      // Reset flag if MongoDB retries transaction
      shouldSendInvoiceEmail = false;

      const currentPayment = await Payment.findById(
        payment._id
      ).session(session);

      if (
        currentPayment.status === "paid" &&
        currentPayment.orderId
      ) {
        createdOrder = await Order.findOne({
          orderId: currentPayment.orderId,
        }).session(session);

        return;
      }

      // Generate order ID
      const orderId = `ORD-${crypto.randomUUID()}`;

      // Reduce product stock safely
      for (const item of currentPayment.items) {
        const stockUpdate = await Product.updateOne(
          {
            _id: item.productId,
            qty: { $gte: item.qty },
          },
          {
            $inc: { qty: -item.qty },
          },
          { session }
        );

        if (stockUpdate.modifiedCount !== 1) {
          throw new Error(
            `Stock unavailable for ${item.productName}. Payment captured; manual resolution required.`
          );
        }
      }

      // Create order with saved payment snapshot
      const [order] = await Order.create(
        [
          {
            orderId,
            userId,
            items: currentPayment.items,
            totalAmount: currentPayment.totalAmount,
            totalItems: currentPayment.totalItems,
            orderStatus: "confirmed",
            paymentStatus: "paid",
          },
        ],
        { session }
      );

      createdOrder = order;

      // Clear cart only if it matches paid snapshot
      const currentCart = await Cart.findOne({
        userId,
      }).session(session);

      if (currentCart) {
        const cartMatches = (
          currentCart.items.length === currentPayment.items.length &&
          currentCart.items.every((cartItem) => {
            const paidItem = currentPayment.items.find(
              (item) =>
                item.productId.toString() ===
                cartItem.productId.toString()
            );

            return paidItem && paidItem.qty === cartItem.qty;
          })
        );

        if (cartMatches) {
          currentCart.items = [];
          await currentCart.save({ session });
        }
      }

      // Update payment record
      currentPayment.razorpayPaymentId = razorpay_payment_id;
      currentPayment.razorpaySignature = razorpay_signature;
      currentPayment.paymentMethod = razorpayPayment.method;
      currentPayment.status = "paid";
      currentPayment.orderId = orderId;

      await currentPayment.save({ session });

      // Mark this as a newly created order
      shouldSendInvoiceEmail = true;
    });

    // ======================================
    // GENERATE PDF INVOICE + SEND BREVO EMAIL
    // ======================================

    if (createdOrder && shouldSendInvoiceEmail) {
      try {
        // Fetch customer details
        const customer = await User.findById(userId)
          .select("name email")
          .lean();

        if (!customer || !customer.email) {
          throw new Error("Customer email not found");
        }

        // Payment details for invoice and email
        const invoicePayment = {
          razorpayPaymentId: razorpay_payment_id,
          paymentMethod: razorpayPayment.method,
        };

        // Generate invoice PDF with product images
        const invoiceBuffer = await generateInvoice({
          order: createdOrder,
          customer,
          payment: invoicePayment,
        });

        // Send email with PDF attachment
        const emailResponse = await sendInvoiceEmail({
          customerEmail: customer.email,
          customerName: customer.name,
          order: createdOrder,
          payment: invoicePayment,
          pdfBuffer: invoiceBuffer,
        });

        console.log("=================================");
        console.log("INVOICE GENERATED SUCCESSFULLY");
        console.log("INVOICE EMAIL SENT SUCCESSFULLY");
        console.log("Customer:", customer.email);
        console.log("Order ID:", createdOrder.orderId);
        console.log("Brevo Message ID:", emailResponse.messageId);
        console.log("=================================");

      } catch (emailError) {
        // Do not fail an already successful payment
        console.error("INVOICE / EMAIL ERROR:", emailError.message);
      }
    }

    // ======================================
    // FINAL RESPONSE
    // ======================================

    return res.status(200).json({
      success: true,
      message: "Payment verified and order placed successfully",
      order: createdOrder,
      invoiceEmailTriggered: shouldSendInvoiceEmail,
    });

  } catch (error) {
    console.error("Verify Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Payment verification failed",
    });

  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// ======================================
// USER - GET MY PAYMENTS
// ======================================

exports.getMyPayments = async (req, res) => {
  try {
    const userId = req.user.id;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const skip = (page - 1) * limit;

    const filter = { userId };

    // Optional status filter
    if (req.query.status) {
      const allowedStatuses = ["created", "paid", "failed"];

      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status",
        });
      }

      filter.status = req.query.status;
    }

    const [payments, totalPayments] = await Promise.all([
      Payment.find(filter)
        .select("-razorpaySignature")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Payment.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Your payment history fetched successfully",
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPayments / limit),
        totalPayments,
        limit,
      },
      payments,
    });

  } catch (error) {
    console.error("Get My Payments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your payments",
    });
  }
};


// ======================================
// MASTER - GET ALL PAYMENTS
// ======================================

exports.getAllPayments = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const skip = (page - 1) * limit;

    const filter = {};

    // Filter by payment status
    if (req.query.status) {
      const allowedStatuses = ["created", "paid", "failed"];

      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status",
        });
      }

      filter.status = req.query.status;
    }

    // Search by Razorpay Order ID, Payment ID or Order ID
    if (req.query.search) {
      const search = req.query.search.trim();

      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const regex = new RegExp(escapedSearch, "i");

      filter.$or = [
        { razorpayOrderId: regex },
        { razorpayPaymentId: regex },
        { orderId: regex },
      ];
    }

    const [payments, totalPayments] = await Promise.all([
      Payment.find(filter)
        .select("-razorpaySignature")
        .populate("userId", "name email phoneNo")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Payment.countDocuments(filter),
    ]);

    // Payment statistics
    const statistics = await Payment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "All payments fetched successfully",

      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPayments / limit),
        totalPayments,
        limit,
      },

      statistics,

      payments,
    });

  } catch (error) {
    console.error("Get All Payments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch all payments",
    });
  }
};