
const Product = require("../../models/product/product");
const {
  cloudinary,
  isCloudinaryConfigured,
} = require("../../config/cloudinary");

// Upload image to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: "products",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    ).end(fileBuffer);
  });
};

// Delete image from Cloudinary
const deleteCloudinaryImage = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) return;

  await cloudinary.uploader.destroy(publicId);
};

// CREATE PRODUCT
exports.createProduct = async (req, res) => {
  let uploadedImage;

  try {
    if (!isCloudinaryConfigured()) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary is not configured",
      });
    }

    const { productName, productCode, price, qty } = req.body;

    if (!productName || !productCode || price === undefined || qty === undefined) {
      return res.status(400).json({
        success: false,
        message: "All product fields are required",
      });
    }

    if (
      !Number.isFinite(Number(price)) ||
      !Number.isFinite(Number(qty)) ||
      Number(price) < 0 ||
      Number(qty) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Price and quantity must be valid non-negative numbers",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Product image is required",
      });
    }

    const existingProduct = await Product.findOne({
      productCode: productCode.trim().toUpperCase(),
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "Product code already exists",
      });
    }

    uploadedImage = await uploadToCloudinary(req.file.buffer);

    const product = await Product.create({
      productName,
      productCode,
      price: Number(price),
      qty: Number(qty),
      image: {
        url: uploadedImage.secure_url,
        public_id: uploadedImage.public_id,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    if (uploadedImage?.public_id) {
      await deleteCloudinaryImage(uploadedImage.public_id).catch(console.error);
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Product code already exists",
      });
    }

    console.error("Create Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
};

// GET ALL PRODUCTS
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get Products Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

// GET SINGLE PRODUCT
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

// UPDATE PRODUCT
exports.updateProduct = async (req, res) => {
  let uploadedImage;

  try {
    const { productId } = req.params;
    const { productName, productCode, price, qty } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (price !== undefined &&
      (!Number.isFinite(Number(price)) || Number(price) < 0)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product price",
      });
    }

    if (qty !== undefined &&
      (!Number.isFinite(Number(qty)) || Number(qty) < 0)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product quantity",
      });
    }

    if (productCode) {
      const existingProduct = await Product.findOne({
        productCode: productCode.trim().toUpperCase(),
        _id: { $ne: productId },
      });

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: "Product code already exists",
        });
      }
    }

    if (req.file) {
      if (!isCloudinaryConfigured()) {
        return res.status(500).json({
          success: false,
          message: "Cloudinary is not configured",
        });
      }

      uploadedImage = await uploadToCloudinary(req.file.buffer);

      const oldPublicId = product.image?.public_id;

      product.image = {
        url: uploadedImage.secure_url,
        public_id: uploadedImage.public_id,
      };

      if (oldPublicId) {
        await deleteCloudinaryImage(oldPublicId);
      }
    }

    if (productName !== undefined) product.productName = productName;
    if (productCode !== undefined) product.productCode = productCode;
    if (price !== undefined) product.price = Number(price);
    if (qty !== undefined) product.qty = Number(qty);

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    if (uploadedImage?.public_id) {
      await deleteCloudinaryImage(uploadedImage.public_id).catch(console.error);
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Product code already exists",
      });
    }

    console.error("Update Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
};

// DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await Product.findByIdAndDelete(req.params.productId);

    if (product.image?.public_id) {
      await deleteCloudinaryImage(product.image.public_id).catch((error) => {
        console.error("Cloudinary image deletion failed:", error);
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};
