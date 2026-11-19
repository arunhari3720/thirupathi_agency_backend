
const express = require("express");
const cors = require("cors");
const path = require("node:path");
const fs = require("node:fs");

const UserRoutes = require("./routes/userroutes/userroutes");
const MasterRoutes = require("./routes/masterroutes/masterroutes");
const ProductRoutes = require("./routes/masterroutes/productroutes");
const paymentRoutes = require("./routes/payment/paymentroutes");
const userDataRoutes = require("./routes/userroutes/userdataroutes");
const masterDataRoutes = require("./routes/masterroutes/userdataroutes");

const CarRoutes= require("./routes/userroutes/cartroutes");
const {
  notFound,
  errorHandler,
} = require("./middlewares/errorHandler");

const app = express();

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

// Body Parsers
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Backend is ready",
  });
});

// Uploads Directory
const uploads = path.resolve("uploads/estimates");

fs.mkdirSync(uploads, { recursive: true });

// Static Files
app.use("/uploads/estimates", express.static(uploads));

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is runnning ",
  });
});

// User Routes
app.use("/api/auth/user", UserRoutes);

// Master Routes
app.use("/api/auth/master", MasterRoutes);
// Product Routes
app.use("/api/auth/master/product", ProductRoutes);
// Cart Routes
app.use("/api/auth/user/cart", CarRoutes);
//
app.use("/api/auth/user/payment", paymentRoutes);
app.use("/api/auth/user-data", userDataRoutes);
app.use("/api/auth/master-data", masterDataRoutes);
// Error Handling
app.use(notFound);
app.use(errorHandler);

// Export App
module.exports = app;
