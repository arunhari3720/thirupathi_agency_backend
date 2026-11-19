
const User = require("../../models/User");
const Cart = require("../../models/cart/cart");
const Order = require("../../models/order/order");
const Payment = require("../../models/payment/payment");
const Product = require("../../models/product/product");

// Pagination helper
const getPagination = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

// Common pagination response
const paginationResponse = (total, page, limit) => ({
  totalRecords: total,
  currentPage: page,
  totalPages: Math.ceil(total / limit),
  limit,
});


// 1. MASTER - GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, userType } = req.query;

    const filter = {};

    if (userType) {
      filter.userType = userType;
    }

    if (search?.trim()) {
      const searchRegex = {
        $regex: search.trim(),
        $options: "i",
      };

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phoneNo: searchRegex },
        { shopName: searchRegex },
      ];
    }

    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select("-password -googleId -__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "All users fetched successfully",
      pagination: paginationResponse(totalUsers, page, limit),
      users,
    });

  } catch (error) {
    console.error("Get All Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch users",
    });
  }
};


// 2. MASTER - GET ALL PRODUCTS

exports.getAllProducts = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const {
      search,
      stockStatus,
      minPrice,
      maxPrice,
    } = req.query;

    const filter = {};

    // Search by product name or product code
    if (search?.trim()) {
      const searchRegex = {
        $regex: search.trim(),
        $options: "i",
      };

      filter.$or = [
        { productName: searchRegex },
        { productCode: searchRegex },
      ];
    }

    // Price range
    if (minPrice !== undefined && minPrice !== "") {
      const min = Number(minPrice);

      if (Number.isFinite(min) && min >= 0) {
        filter.price = {
          ...filter.price,
          $gte: min,
        };
      }
    }

    if (maxPrice !== undefined && maxPrice !== "") {
      const max = Number(maxPrice);

      if (Number.isFinite(max) && max >= 0) {
        filter.price = {
          ...filter.price,
          $lte: max,
        };
      }
    }

    // Stock filters
    if (stockStatus === "in_stock") {
      filter.qty = { $gt: 10 };
    } else if (stockStatus === "low_stock") {
      filter.qty = { $gt: 0, $lte: 10 };
    } else if (stockStatus === "out_of_stock") {
      filter.qty = 0;
    }

    const [products, totalProducts] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "All products fetched successfully",
      pagination: paginationResponse(
        totalProducts,
        page,
        limit
      ),
      products,
    });

  } catch (error) {
    console.error("Get All Products Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch products",
      error: error.message,
    });
  }
};



// 3. MASTER - GET ALL ORDERS
exports.getAllOrders = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, status } = req.query;

    const filter = {};

    if (status) {
      filter.orderStatus = status;
    }

    if (search?.trim()) {
      filter.orderId = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .populate(
          "userId",
          "name email phoneNo userType shopName"
        )
        .populate(
          "items.productId",
          "productName productCode image"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "All orders fetched successfully",
      pagination: paginationResponse(totalOrders, page, limit),
      orders,
    });

  } catch (error) {
    console.error("Get All Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders",
    });
  }
};


// 4. MASTER - GET ALL PAYMENTS

exports.getAllPayments = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const {
      search,
      status,
      paymentMethod,
      dateFrom,
      dateTo,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (paymentMethod?.trim()) {
      filter.paymentMethod = {
        $regex: paymentMethod.trim(),
        $options: "i",
      };
    }

    if (search?.trim()) {
      const searchRegex = {
        $regex: search.trim(),
        $options: "i",
      };

      filter.$or = [
        { razorpayOrderId: searchRegex },
        { razorpayPaymentId: searchRegex },
        { orderId: searchRegex },
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};

      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00.000`);

        if (!Number.isNaN(from.getTime())) {
          filter.createdAt.$gte = from;
        }
      }

      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59.999`);

        if (!Number.isNaN(to.getTime())) {
          filter.createdAt.$lte = to;
        }
      }

      if (Object.keys(filter.createdAt).length === 0) {
        delete filter.createdAt;
      }
    }

    const [payments, totalPayments] = await Promise.all([
      Payment.find(filter)
        .select("-razorpaySignature")
        .populate(
          "userId",
          "name email phoneNo userType shopName"
        )
        .populate(
          "items.productId",
          "productName productCode image"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Payment.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "All payments fetched successfully",
      pagination: paginationResponse(
        totalPayments,
        page,
        limit
      ),
      payments,
    });

  } catch (error) {
    console.error("Get All Payments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch payments",
      error: error.message,
    });
  }
};

