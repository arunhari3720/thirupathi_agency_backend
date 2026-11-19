const crypto = require("crypto");
const mongoose = require("mongoose");
const Cart = require("../../models/cart/cart");
const Order = require("../../models/order/order");
const Product = require("../../models/product/product");

// ADD TO CART
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, qty = 1 } = req.body;

    if (!mongoose.isValidObjectId(productId) ||
        !Number.isInteger(Number(qty)) ||
        Number(qty) < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID or quantity",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    const newQty = existingItem
      ? existingItem.qty + Number(qty)
      : Number(qty);

    if (newQty > product.qty) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.qty} items available`,
      });
    }

    if (existingItem) {
      existingItem.qty = newQty;
    } else {
      cart.items.push({
        productId,
        qty: Number(qty),
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Add To Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add product to cart",
    });
  }
};

// GET CART
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId })
      .populate("items.productId");

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: {
          items: [],
          totalAmount: 0,
          totalItems: 0,
        },
      });
    }

    let totalAmount = 0;
    let totalItems = 0;

    const items = cart.items.map((item) => {
      const product = item.productId;

      if (!product) return null;

      const subtotal = product.price * item.qty;

      totalAmount += subtotal;
      totalItems += item.qty;

      return {
        product,
        qty: item.qty,
        subtotal,
      };
    }).filter(Boolean);

    return res.status(200).json({
      success: true,
      cart: {
        _id: cart._id,
        items,
        totalAmount,
        totalItems,
      },
    });
  } catch (error) {
    console.error("Get Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
    });
  }
};

// UPDATE CART QUANTITY
exports.updateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, qty } = req.body;

    if (
      !mongoose.isValidObjectId(productId) ||
      !Number.isInteger(Number(qty)) ||
      Number(qty) < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID or quantity",
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    const product = await Product.findById(productId);

    if (!product || Number(qty) > product.qty) {
      return res.status(400).json({
        success: false,
        message: "Requested quantity is not available",
      });
    }

    item.qty = Number(qty);
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cart,
    });
  } catch (error) {
    console.error("Update Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update cart",
    });
  }
};

// REMOVE CART ITEM
exports.removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart,
    });
  } catch (error) {
    console.error("Remove Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove cart item",
    });
  }
};
exports.checkout = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.user.id;

    let createdOrder;

    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ userId }).session(session);

      if (!cart || cart.items.length === 0) {
        throw new Error("Your cart is empty");
      }

      const orderItems = [];
      let totalAmount = 0;
      let totalItems = 0;

      for (const item of cart.items) {
        const product = await Product.findById(
          item.productId
        ).session(session);

        if (!product) {
          throw new Error("One or more products are unavailable");
        }

        if (product.qty < item.qty) {
          throw new Error(
            `Insufficient stock for ${product.productName}`
          );
        }

        const subtotal = product.price * item.qty;

        orderItems.push({
          productId: product._id,
          productName: product.productName,
          productCode: product.productCode,
          price: product.price,
          qty: item.qty,
          image: {
            url: product.image.url,
            public_id: product.image.public_id,
          },
          subtotal,
        });

        totalAmount += subtotal;
        totalItems += item.qty;

        // Reduce stock safely
        const stockUpdate = await Product.updateOne(
          {
            _id: product._id,
            qty: { $gte: item.qty },
          },
          {
            $inc: { qty: -item.qty },
          },
          { session }
        );

        if (stockUpdate.modifiedCount !== 1) {
          throw new Error(
            `Stock unavailable for ${product.productName}`
          );
        }
      }

      const [order] = await Order.create(
        [
          {
            orderId: `ORD-${crypto.randomUUID()}`,
            userId,
            items: orderItems,
            totalAmount,
            totalItems,
            orderStatus: "pending",
            paymentStatus: "pending",
          },
        ],
        { session }
      );

      createdOrder = order;

      // Clear cart only after order creation
      await Cart.deleteOne({ userId }, { session });
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: createdOrder,
    });
  } catch (error) {
    console.error("Checkout Error:", error);

    const clientErrors = [
      "Your cart is empty",
      "One or more products are unavailable",
    ];

    const isClientError =
      clientErrors.includes(error.message) ||
      error.message.startsWith("Insufficient stock") ||
      error.message.startsWith("Stock unavailable");

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: isClientError
        ? error.message
        : "Failed to place order",
    });
  } finally {
    await session.endSession();
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email phoneNo")
      .populate("items.productId", "productName productCode")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get All Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};


exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (["delivered", "cancelled"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "This order is already completed or cancelled",
      });
    }

    order.orderStatus = orderStatus;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ userId })
      .populate("items.productId", "productName productCode")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get My Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your orders",
    });
  }
};
