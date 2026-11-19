
const express = require("express");
const router = express.Router();

const {
  getMyCompleteData,
} = require("../../controllers/usercontroller/userdatacontroller");

const {verifyToken} = require("../../middlewares/auth_middleware");

// Logged-in user complete data
router.get("/my-data", verifyToken, getMyCompleteData);

module.exports = router;
