/**
 * Image Upload Middleware (Multer Memory Storage)
 * Intercepts multipart/form-data requests, stores images in memory buffer,
 * validates file size (max 5 MB) and allowed image MIME types.
 */

const multer = require('multer');

// Store file in memory buffer rather than saving to local disk
const storage = multer.memoryStorage();

/**
 * Filter function to restrict uploaded files to image formats only (jpg, png, webp).
 */
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file format. Only JPG, PNG, and WebP images are allowed.'),
      false
    );
  }
};

// Configure multer instance with 5MB limit
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum
  },
  fileFilter,
});

/**
 * uploadSingleImage wraps multer single upload and captures multer-specific errors
 * (e.g. file size exceeded) into friendly JSON error responses.
 */
const uploadSingleImage = (fieldName = 'image') => {
  const single = upload.single(fieldName);

  return (req, res, next) => {
    single(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Image size exceeds the maximum limit of 5 MB.',
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  };
};

module.exports = {
  uploadSingleImage,
};
