
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const CheckoutOTP = require("../../models/checkoutotp/checkoutotp");
const GuestCustomer = require("../../models/guestuser/guestuser");

const sendCheckoutOtpEmail = require(
  "../../../utils/emailsservice/checkoutotp"
);

const normalizeEmail = (email) =>
  String(email || "").trim().toLowerCase();

const hashOtp = (otp) =>
  crypto
    .createHmac("sha256", process.env.CHECKOUT_OTP_SECRET)
    .update(otp)
    .digest("hex");

const compareOtp = (first, second) => {
  const a = Buffer.from(first, "hex");
  const b = Buffer.from(second, "hex");

  return (
    a.length === b.length &&
    crypto.timingSafeEqual(a, b)
  );
};


// ======================================
// 1. SEND GUEST CHECKOUT OTP
// ======================================

exports.sendGuestCheckoutOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const mobile = String(req.body.mobile || "").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Valid email address required",
      });
    }

    if (mobile && !/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number",
      });
    }

    // Check guest customer
    const existingCustomer = await GuestCustomer.findOne({
      email,
      isActive: true,
    });

    // New customer must provide mobile
    if (!existingCustomer && !mobile) {
      return res.status(400).json({
        success: false,
        type: "new_customer",
        message: "Mobile number is required",
      });
    }

    // Prevent duplicate mobile registration
    if (!existingCustomer) {
      const mobileExists = await GuestCustomer.findOne({
        mobile,
        isActive: true,
      });

      if (mobileExists) {
        return res.status(409).json({
          success: false,
          message: "Mobile number is already registered",
        });
      }
    }

    // Resend cooldown
    const previousOTP = await CheckoutOTP.findOne({ email });

    if (
      previousOTP &&
      Date.now() - previousOTP.lastSentAt.getTime() < 60 * 1000
    ) {
      return res.status(429).json({
        success: false,
        message: "Please wait 60 seconds before requesting OTP",
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    const otpHash = hashOtp(otp);

    // Save OTP separately
    await CheckoutOTP.findOneAndUpdate(
      { email },
      {
        $set: {
          otpHash,
          mobile: existingCustomer ? existingCustomer.mobile : mobile,
          attempts: 0,
          verifiedAt: null,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          lastSentAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    try {
      await sendCheckoutOtpEmail({
        email,
        name: existingCustomer?.name || "Customer",
        otp,
      });
    } catch (emailError) {
      await CheckoutOTP.deleteOne({
        email,
        otpHash,
      });

      throw emailError;
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (error) {
    console.error("Guest Checkout OTP Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to send OTP",
    });
  }
};


// ======================================
// 2. VERIFY GUEST CHECKOUT OTP
// ======================================

exports.verifyGuestCheckoutOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    if (!email || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Valid email and OTP required",
      });
    }

    const record = await CheckoutOTP.findOne({
      email,
      verifiedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found",
      });
    }

    if (record.attempts >= 5) {
      await CheckoutOTP.deleteOne({ _id: record._id });

      return res.status(429).json({
        success: false,
        message: "Maximum OTP attempts reached",
      });
    }

    const submittedHash = hashOtp(otp);

    if (!compareOtp(submittedHash, record.otpHash)) {
      record.attempts += 1;
      await record.save();

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP",
      });
    }

    // Find existing guest customer
    const existingCustomer = await GuestCustomer.findOne({
      email,
      isActive: true,
    });

    record.verifiedAt = new Date();
    await record.save();

    // Generate checkout verification token
    const checkoutToken = jwt.sign(
      {
        email,
        mobile: record.mobile,
        customerId: existingCustomer?._id || null,
        type: existingCustomer ? "existing_guest" : "new_guest",
      },
      process.env.CHECKOUT_JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",

      customerType: existingCustomer
        ? "existing_guest"
        : "new_guest",

      checkoutToken,

      customer: existingCustomer
        ? {
            name: existingCustomer.name,
            email: existingCustomer.email,
            mobile: existingCustomer.mobile,
            shopName: existingCustomer.shopName,
            addresses: existingCustomer.addresses,
          }
        : null,
    });

  } catch (error) {
    console.error("Guest OTP Verification Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "OTP verification failed",
    });
  }
};


// ======================================
// 3. REGISTER NEW GUEST CUSTOMER
// ======================================

exports.registerGuestCustomer = async (req, res) => {
  try {
    const {
      name,
      shopName,
      address,
    } = req.body;

    const email = req.guest.email;
    const mobile = req.guest.mobile;

    if (req.guest.type !== "new_guest" || !mobile) {
      return res.status(403).json({
        success: false,
        message: "Invalid guest registration session",
      });
    }

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    if (
      !address?.addressLine?.trim() ||
      !address?.city?.trim() ||
      !address?.state?.trim() ||
      !/^\d{6}$/.test(String(address?.pincode || ""))
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete valid address is required",
      });
    }

    // Prevent duplicate email/mobile
    const duplicate = await GuestCustomer.findOne({
      $or: [
        { email },
        { mobile },
      ],
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Customer already exists. Please verify your details.",
      });
    }

    const customer = await GuestCustomer.create({
      name: name.trim(),
      email,
      mobile,
      shopName: shopName?.trim() || "",

      addresses: [
        {
          addressLine: address.addressLine.trim(),
          city: address.city.trim(),
          district: address.district?.trim() || "",
          state: address.state.trim(),
          pincode: String(address.pincode),
          isDefault: true,
        },
      ],

      isEmailVerified: true,
    });

    return res.status(201).json({
      success: true,
      message: "Guest customer registered successfully",

      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        mobile: customer.mobile,
        shopName: customer.shopName,
        addresses: customer.addresses,
      },
    });

  } catch (error) {
    console.error("Guest Registration Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to register guest customer",
    });
  }
};
