// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { initializeModels } = require("./models");

// Load environment variables
dotenv.config();

// Import routes
const { router: authRoutes, verifyToken } = require("./routes/auth");
const contactFormRoute = require("./routes/contactForm");
const homeEnquiryFormRoute = require("./routes/homeEnquiryForm");
const tourPackagesFormRoute = require("./routes/tourPackagesForm");
const hotelsFormRoute = require("./routes/hotelEnquiry");
const tourPackageDetailFormRoute = require("./routes/tourPackageDetailForm");
const carRentalDetailFormRoute = require("./routes/carRentalDetailForm");
const dashboardRoutes = require("./routes/dashboardRoutes");
// New routes
const carRentalRoute = require("./routes/carRental");
const hotelRoute = require("./routes/hotel");
const hotelEnquiryRoute = require("./routes/hotelEnquiry");

const app = express();

// Initialize database and models
initializeModels();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Public routes
app.use("/api/auth", authRoutes);
app.use("/api/contact", contactFormRoute);
app.use("/api/home-enquiries", homeEnquiryFormRoute);
app.use("/api/tour-packages", tourPackagesFormRoute);
app.use("/api/hotels", hotelsFormRoute);
app.use("/api/tour-package-detail", tourPackageDetailFormRoute);
app.use("/api/car-rental-detail", carRentalDetailFormRoute);
// New route handlers
app.use("/api/car-rentals", carRentalRoute);
app.use("/api/hotels-list", hotelRoute);
app.use("/api/hotel-enquiries", hotelEnquiryRoute);

console.log("Registered route: /api/tour-packages");
console.log("Registered route: /api/car-rentals");
console.log("Registered route: /api/hotels-list");

app.use("/api/dashboard", dashboardRoutes);

// Protected dashboard routes
app.use("/api/dashboard/welcome", verifyToken, (req, res) => {
  res.json({ message: "Welcome to the dashboard API" });
});

// Basic route for testing
app.get("/api/health", (req, res) => {

  res.send({ status: 'OK', message: 'Backend is running!' });

  res.send("Lumora Server is still Alive");

});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ success: false, message: "Something went wrong!" });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
