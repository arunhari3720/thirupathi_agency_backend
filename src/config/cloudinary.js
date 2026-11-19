
const { v2: cloudinary } = require("cloudinary");

const configured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const isCloudinaryConfigured = () => configured;
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return reject(new Error("Cloudinary is not configured. Check environment variables."));
    }

    cloudinary.uploader.upload_stream(
      {
        folder: "thirupathi-agencies/profiles",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    ).end(buffer);
  });
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  isCloudinaryConfigured,
};
