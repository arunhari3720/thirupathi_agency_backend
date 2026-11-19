const express = require("express");
const router = express.Router();

const {
  createOrder,
  verifyPayment,
   getMyPayments,
  getAllPayments,
} = require("../../controllers/payment/paymentcontroller");

const { verifyToken } = require("../../middlewares/auth_middleware");

// Create Razorpay Order
router.post("/create-order", verifyToken, createOrder);

// Verify Payment
router.post("/verify-payment", verifyToken, verifyPayment);
// User payment history
router.get("/my-payments", verifyToken, getMyPayments);

// Master - all payments
router.get("/all-payments", verifyToken,  getAllPayments);

module.exports = router;