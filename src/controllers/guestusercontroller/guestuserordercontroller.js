
const mongoose = require("mongoose");
const crypto = require("crypto");

const Product = require("../../models/product/product");
const GuestCustomer = require("../../models/guestuser/guestuser");
const Order = require("../../models/order/order");

const sendOrderConfirmationEmail = require(
  "../../../utils/emailsservice/sendOrderConfirmationEmail"
);

exports.createGuestOrder = async (req, res) => {
  try {
    const { email, mobile } = req.guest;

    const { items, addressId } = req.body;

    // 1. Verify guest customer
    const guest = await GuestCustomer.findOne({
      email,
      mobile,
      isEmailVerified: true,
      isActive: true,
    });

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest customer not found",
      });
    }

    // 2. Validate address ownership
    const selectedAddress = guest.addresses.id(addressId);

    if (!selectedAddress) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery address",
      });
    }

    // 3. Validate cart
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    const productQuantities = new Map();

    for (const item of items) {
      if (
        !mongoose.Types.ObjectId.isValid(item.productId) ||
        !Number.isInteger(Number(item.qty)) ||
        Number(item.qty) < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product or quantity",
        });
      }

      const id = String(item.productId);

      productQuantities.set(
        id,
        (productQuantities.get(id) || 0) + Number(item.qty)
      );
    }

    // 4. Fetch actual products from MongoDB
    const products = await Product.find({
      _id: { $in: [...productQuantities.keys()] },
    });

    if (products.length !== productQuantities.size) {
      return res.status(404).json({
        success: false,
        message: "Some products are unavailable",
      });
    }

    let totalAmount = 0;
    let totalItems = 0;

    const orderItems = [];

    for (const product of products) {
      const qty = productQuantities.get(product._id.toString());

      if (product.qty < qty) {
        return res.status(400).json({
          success: false,
          message: `${product.productName} has insufficient stock`,
        });
      }

      const subtotal = product.price * qty;

      totalAmount += subtotal;
      totalItems += qty;

      orderItems.push({
        productId: product._id,
        productName: product.productName,
        productCode: product.productCode,
        price: product.price,
        qty,
        image: {
          url: product.image.url,
          public_id: product.image.public_id,
        },
        subtotal,
      });
    }

    // 5. Create order
    const orderId =
      `TA-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    const order = await Order.create({
      orderId,

      userId: null,
      guestCustomerId: guest._id,

      customerDetails: {
        name: guest.name,
        email: guest.email,
        mobile: guest.mobile,
        shopName: guest.shopName || "",

        address: {
          addressLine: selectedAddress.addressLine,
          city: selectedAddress.city,
          district: selectedAddress.district || "",
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
        },
      },

      items: orderItems,
      totalAmount,
      totalItems,

      orderType: "whatsapp",
      orderStatus: "pending",
      paymentStatus: "pending",
      whatsappStatus: "pending",
    });

    // 6. Update guest order count
    await GuestCustomer.findByIdAndUpdate(
      guest._id,
      { $inc: { totalOrders: 1 } }
    );

    // 7. Generate WhatsApp message
    const phone = process.env.WHATSAPP_BUSINESS_NUMBER;

    if (!phone) {
      console.error("WhatsApp number missing in environment");
    }

    const productMessage = order.items.map((item, index) =>
      `${index + 1}. ${item.productName} - ${item.qty} x Rs.${item.price} = Rs.${item.subtotal}`
    ).join("\n");

    const address = selectedAddress;

    const message = `
Hello Thirupathi Agencies,

I would like to confirm my order.

Order ID: ${order.orderId}

Customer: ${guest.name}
Mobile: ${guest.mobile}
Email: ${guest.email}
Shop: ${guest.shopName || "N/A"}

Delivery Address:
${address.addressLine},
${address.city},
${address.state} - ${address.pincode}

Products:
${productMessage}

Total Items: ${totalItems}
Total Amount: Rs.${totalAmount}

Please confirm my order.

Thank you.
`;

    const whatsappUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : null;

    // 8. Send confirmation email
    let emailSent = false;

    try {
      await sendOrderConfirmationEmail({
        customer: {
          name: guest.name,
          email: guest.email,
          address: order.customerDetails.address,
        },
        order,
      });

      emailSent = true;
    } catch (emailError) {
      console.error("Guest order email error:", emailError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Guest order created successfully",
      order: {
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        totalItems: order.totalItems,
        orderStatus: order.orderStatus,
      },
      emailSent,
      whatsappUrl,
    });

  } catch (error) {
    console.error("Guest Order Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create guest order",
    });
  }
};
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .select("productName productCode price qty image createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      totalProducts: products.length,
      products,
    });
  } catch (error) {
    console.error("Get All Products Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};
