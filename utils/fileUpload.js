// utils/fileUpload.js
const multer = require("multer");
const fs = require("fs-extra");
const path = require("path");

// Create uploads directory if it doesn't exist
const createUploadsDir = () => {
  const uploadsDir = path.join(__dirname, "../uploads");
  const carUploadsDir = path.join(uploadsDir, "cars");
  const hotelUploadsDir = path.join(uploadsDir, "hotels");

  fs.ensureDirSync(uploadsDir);
  fs.ensureDirSync(carUploadsDir);
  fs.ensureDirSync(hotelUploadsDir);
};

// Create uploads directory
createUploadsDir();

// Configure storage for car images
const carStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/cars"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "car-" + uniqueSuffix + ext);
  },
});

// Configure storage for hotel images
const hotelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/hotels"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "hotel-" + uniqueSuffix + ext);
  },
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Create multer upload instances
const uploadCarImages = multer({
  storage: carStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).array("images", 10); // Allow up to 10 images

const uploadHotelImages = multer({
  storage: hotelStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).array("images", 10); // Allow up to 10 images

module.exports = {
  uploadCarImages,
  uploadHotelImages,
};
