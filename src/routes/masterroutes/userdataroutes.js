
const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getAllProducts,
  getAllOrders,
  getAllPayments,
} = require("../../controllers/mastercontroller/userdatacontroller");

const {verifyToken,verifyMaster} = require("../../middlewares/auth_middleware");

// Master - All Users
// Master - All Users
router.get("/users", verifyToken, verifyMaster, getAllUsers);

// Master - All Products
router.get("/products", verifyToken, verifyMaster, getAllProducts);

// Master - All Orders
router.get("/orders", verifyToken, verifyMaster, getAllOrders);

// Master - All Payments
router.get("/payments", verifyToken, verifyMaster, getAllPayments);

module.exports = router;
