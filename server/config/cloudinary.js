/**
 * Cloudinary Configuration and Upload Service
 * Configures Cloudinary SDK and provides helper methods to stream image buffers
 * directly to cloud storage without saving temporary files to disk.
 */

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Checks if valid Cloudinary credentials have been provided.
 * 
 * @returns {boolean} True if credentials are configured
 */
const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Uploads an in-memory image buffer directly to Cloudinary.
 * If credentials are not configured, falls back to an encoded data URL
 * so that development and automated tests can proceed without external keys.
 * 
 * @param {Buffer} fileBuffer - Image buffer from multer memoryStorage
 * @param {string} folder - Target folder name on Cloudinary
 * @param {string} mimetype - Image MIME type (e.g., 'image/jpeg')
 * @returns {Promise<string>} Secure URL of the uploaded image
 */
const uploadImageBuffer = (fileBuffer, folder = 'wastewise_contributions', mimetype = 'image/jpeg') => {
  return new Promise((resolve, reject) => {
    // Graceful fallback for local development without active Cloudinary keys
    if (!isCloudinaryConfigured()) {
      console.warn('Warning: Cloudinary credentials missing. Using local data-URL fallback.');
      const base64Data = fileBuffer.toString('base64');
      return resolve(`data:${mimetype};base64,${base64Data}`);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) {
          return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        }
        resolve(result.secure_url);
      }
    );

    // Write file buffer to upload stream
    uploadStream.end(fileBuffer);
  });
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadImageBuffer,
};
