
const express = require("express");
const router = express.Router();

// const {
//   addToCart,
//   getCart,
//   updateCart,
//   removeCartItem,
//   checkout,
//     getAllOrders,

// } = require("../../controllers/usercontroller/cartcontroller");

// const {verifyToken,verifyMaster} = require("../../middlewares/auth_middleware");

// // Cart routes
// router.post("/add", verifyToken, addToCart);
// router.get("/get", verifyToken, getCart);
// router.put("/update", verifyToken, updateCart);
// router.delete("/remove/:productId", verifyToken, removeCartItem);
// router.get("/getall", verifyToken, getAllOrders);

// // Buy / Checkout
// router.post("/checkout", verifyToken, checkout);

// module.exports = router;

const {
  addToCart,
  getCart,
  updateCart,
  removeCartItem,
  checkout,
  getAllOrders,
  updateOrderStatus,
  getMyOrders,
} = require("../../controllers/usercontroller/cartcontroller");

const {
  verifyToken,
  verifyMaster,
} = require("../../middlewares/auth_middleware");

// Customer cart routes
router.post("/add", verifyToken, addToCart);
router.get("/get", verifyToken, getCart);
router.put("/update", verifyToken, updateCart);
router.delete("/remove/:productId", verifyToken, removeCartItem);

// Master order management
router.get("/getall",verifyToken  ,getAllOrders);

router.patch(
  "/status/:orderId",
  verifyToken,
  updateOrderStatus
);

// Customer checkout
router.post("/checkout", verifyToken, checkout);
router.get("/my-orders", verifyToken, getMyOrders);

module.exports = router;
