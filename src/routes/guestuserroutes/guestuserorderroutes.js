const express = require("express");
const router = express.Router();

const {
  createGuestOrder,
  getAllProducts,
} = require("../../controllers/guestusercontroller/guestuserordercontroller");

const {guestCheckoutAuth} = require(
  "../../middlewares/auth_middleware"
);
router.get("/products/get-all", getAllProducts);

router.post(
  "/create",
  guestCheckoutAuth,
  createGuestOrder
);

module.exports = router;