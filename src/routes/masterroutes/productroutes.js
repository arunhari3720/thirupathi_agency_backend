
const express = require("express");
const router = express.Router();

const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../../controllers/mastercontroller/productcontroller");

const upload = require("../../middlewares/multer_upload");

// Replace with your existing master authentication middleware
const {verifyMaster,verifyToken} = require("../../middlewares/auth_middleware");

// Create product
// router.post(
//   "/create",
//   verifyToken,
//   verifyMaster,
//   upload.single("image"),
//   createProduct
// );
router.post(
  "/create",
  verifyToken,
  verifyMaster,
  (req, res, next) => {
    console.log("Before Multer");
    next();
  },
  upload.single("image"),
  (req, res, next) => {
    console.log("After Multer - File:", req.file);
    console.log("After Multer - Body:", req.body);
    next();
  },
  createProduct
);
// Get all products
router.get(
  "/getall",
  getAllProducts
);

// Get single product
router.get(
  "/get/:productId",
  verifyMaster,
  getProductById
);

// Update product
router.put(
  "/update/:productId",
  verifyToken,
  verifyMaster,
  upload.single("image"),
  updateProduct
);

// Delete product
router.delete(
  "/delete/:productId",
  verifyToken,
  verifyMaster,
  deleteProduct
);

module.exports = router;
