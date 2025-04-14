const express = require("express");
const router = express.Router();
const { sendEmail } = require("../utils/emailConfig");
const { HomeEnquiry } = require("../models");
const { Op, fn, col, literal } = require("sequelize");
const sequelize = require("../config/database");

// POST route for form submission
router.post("/api", async (req, res) => {
  try {
    const { formType, name, email, phone } = req.body;

    // Validate required common fields
    if (!name || !email || !phone || !formType) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Save to database
    const enquiry = await HomeEnquiry.create(req.body);

    let subject = "";
    let htmlContent = "";

    // Generate email content based on form type
    if (formType === "cars") {
      const { fromLocation, toLocation, pickupDate, carType } = req.body;

      subject = `Car Rental Enquiry: ${fromLocation} to ${toLocation}`;
      htmlContent = `
        <h2>New Car Rental Enquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>From Location:</strong> ${fromLocation}</p>
        <p><strong>To Location:</strong> ${toLocation}</p>
        <p><strong>Pickup Date:</strong> ${formatDate(pickupDate)}</p>
        <p><strong>Car Type:</strong> ${carType || "Not specified"}</p>
        <hr>
        <p><em>This enquiry was submitted from the Car Rental form on the RPS Tours website.</em></p>
      `;
    } else if (formType === "tourPackages") {
      const { packageType, travelDate, duration, travelers } = req.body;

      subject = `Tour Package Enquiry: ${packageType}`;
      htmlContent = `
        <h2>New Tour Package Enquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Package Type:</strong> ${packageType}</p>
        <p><strong>Travel Date:</strong> ${formatDate(travelDate)}</p>
        <p><strong>Duration:</strong> ${duration || "Not specified"}</p>
        <p><strong>Number of Travelers:</strong> ${
          travelers || "Not specified"
        }</p>
        <hr>
        <p><em>This enquiry was submitted from the Tour Packages form on the RPS Tours website.</em></p>
      `;
    } else if (formType === "hotels") {
      const { destination, checkIn, checkOut, rooms } = req.body;

      subject = `Hotel Booking Enquiry: ${destination}`;
      htmlContent = `
        <h2>New Hotel Booking Enquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Destination:</strong> ${destination}</p>
        <p><strong>Check-in Date:</strong> ${formatDate(checkIn)}</p>
        <p><strong>Check-out Date:</strong> ${formatDate(checkOut)}</p>
        <p><strong>Number of Rooms:</strong> ${rooms || "1"}</p>
        <hr>
        <p><em>This enquiry was submitted from the Hotels form on the RPS Tours website.</em></p>
      `;
    }

    // Prepare email content
    const mailOptions = {
      subject: subject,
      html: htmlContent,
    };

    // Send email
    await sendEmail(mailOptions);

    // Send confirmation email to customer
    const confirmationMailOptions = {
      to: email,
      subject: `Thank you for your enquiry - RPS Tours`,
      html: `
        <h2>Thank You for Your Enquiry</h2>
        <p>Dear ${name},</p>
        <p>We have received your enquiry and our team will get back to you shortly.</p>
        <p>Best Regards,<br>RPS Tours Team</p>
      `,
    };

    await sendEmail(confirmationMailOptions);

    res.status(200).json({
      success: true,
      message:
        "Your enquiry has been sent successfully. We will contact you soon!",
      data: enquiry,
    });
  } catch (error) {
    console.error("Home enquiry form submission error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send your enquiry. Please try again later.",
    });
  }
});

// GET route for retrieving all home enquiries
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};

    if (status && status !== "all") {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }

    // Get enquiries with pagination
    const { count, rows } = await HomeEnquiry.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
    });

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: Number.parseInt(page),
        itemsPerPage: Number.parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching home enquiries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch home enquiries",
    });
  }
});

// GET home enquiries by type with pagination, filtering, and search
router.get("/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    // Validate type
    if (!["cars", "tourPackages", "hotels"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry type",
      });
    }

    // Build where clause
    const whereClause = { formType: type };

    if (status && status !== "all") {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }

    // Get enquiries with pagination
    const { count, rows } = await HomeEnquiry.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
    });

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: Number.parseInt(page),
        itemsPerPage: Number.parseInt(limit),
      },
    });
  } catch (error) {
    console.error(`Error fetching ${req.params.type} enquiries:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch enquiries",
    });
  }
});

// GET chart data for all home enquiries
// router.get("/chart", async (req, res) => {
//   try {
//     // Get the last 30 days
//     const endDate = new Date();
//     const startDate = new Date();
//     startDate.setDate(startDate.getDate() - 30);

//     // Get daily counts
//     const dailyCounts = await HomeEnquiry.findAll({
//       where: {
//         createdAt: {
//           [Op.between]: [startDate, endDate],
//         },
//       },
//       attributes: [
//         [fn("DATE", col("createdAt")), "date"],
//         [fn("COUNT", col("id")), "count"],
//       ],
//       group: [fn("DATE", col("createdAt"))],
//       order: [[fn("DATE", col("createdAt")), "ASC"]],
//     });

//     // Get status counts
//     const statusCounts = await HomeEnquiry.findAll({
//       attributes: ["status", [fn("COUNT", col("id")), "count"]],
//       group: ["status"],
//       order: [[literal("count"), "DESC"]],
//     });

//     // Format data for Chart.js
//     const labels = [];
//     const data = [];

//     // Create a map of dates to counts
//     const dateMap = new Map();
//     dailyCounts.forEach((item) => {
//       dateMap.set(
//         item.getDataValue("date"),
//         Number.parseInt(item.getDataValue("count"))
//       );
//     });

//     // Fill in all dates in the range
//     for (
//       let d = new Date(startDate);
//       d <= endDate;
//       d.setDate(d.getDate() + 1)
//     ) {
//       const dateStr = d.toISOString().split("T")[0];
//       labels.push(dateStr);
//       data.push(dateMap.get(dateStr) || 0);
//     }

//     res.status(200).json({
//       success: true,
//       data: {
//         labels,
//         datasets: [
//           {
//             label: "Home Enquiries",
//             data,
//             backgroundColor: "rgba(67, 97, 238, 0.5)",
//             borderColor: "rgba(67, 97, 238, 1)",
//             borderWidth: 1,
//           },
//         ],
//         statusData: statusCounts.map((item) => ({
//           status: item.status || "pending",
//           count: Number.parseInt(item.getDataValue("count")),
//         })),
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching chart data:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch chart data",
//     });
//   }
// });

// // GET chart data for specific type of home enquiries
// router.get("/chart/:type", async (req, res) => {
//   try {
//     const { type } = req.params;

//     // Validate type
//     if (!["cars", "tourPackages", "hotels"].includes(type)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid enquiry type",
//       });
//     }

//     // Get the last 30 days
//     const endDate = new Date();
//     const startDate = new Date();
//     startDate.setDate(startDate.getDate() - 30);

//     // Get daily counts
//     const dailyCounts = await HomeEnquiry.findAll({
//       where: {
//         formType: type,
//         createdAt: {
//           [Op.between]: [startDate, endDate],
//         },
//       },
//       attributes: [
//         [fn("DATE", col("createdAt")), "date"],
//         [fn("COUNT", col("id")), "count"],
//       ],
//       group: [fn("DATE", col("createdAt"))],
//       order: [[fn("DATE", col("createdAt")), "ASC"]],
//     });

//     // Get status counts
//     const statusCounts = await HomeEnquiry.findAll({
//       where: {
//         formType: type,
//       },
//       attributes: ["status", [fn("COUNT", col("id")), "count"]],
//       group: ["status"],
//       order: [[literal("count"), "DESC"]],
//     });

//     // Format data for Chart.js
//     const labels = [];
//     const data = [];

//     // Create a map of dates to counts
//     const dateMap = new Map();
//     dailyCounts.forEach((item) => {
//       dateMap.set(
//         item.getDataValue("date"),
//         Number.parseInt(item.getDataValue("count"))
//       );
//     });

//     // Fill in all dates in the range
//     for (
//       let d = new Date(startDate);
//       d <= endDate;
//       d.setDate(d.getDate() + 1)
//     ) {
//       const dateStr = d.toISOString().split("T")[0];
//       labels.push(dateStr);
//       data.push(dateMap.get(dateStr) || 0);
//     }

//     res.status(200).json({
//       success: true,
//       data: {
//         labels,
//         datasets: [
//           {
//             label: `${type} Enquiries`,
//             data,
//             backgroundColor: "rgba(67, 97, 238, 0.5)",
//             borderColor: "rgba(67, 97, 238, 1)",
//             borderWidth: 1,
//           },
//         ],
//         statusData: statusCounts.map((item) => ({
//           status: item.status || "pending",
//           count: Number.parseInt(item.getDataValue("count")),
//         })),
//       },
//     });
//   } catch (error) {
//     console.error(`Error fetching ${req.params.type} chart data:`, error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch chart data",
//     });
//   }
// });
// GET chart data for all or specific type of home enquiries
// GET chart data for all or specific type of home enquiries
router.get("/chart/:type?", async (req, res) => {
  try {
    const { type } = req.params;

    // Validate type
    if (type && !["cars", "tourPackages", "hotels", "all"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry type",
      });
    }

    // Get the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Create query condition based on type (if provided)
    const whereCondition =
      type && type !== "all"
        ? {
            formType: type,
            createdAt: {
              [Op.between]: [startDate, endDate],
            },
          }
        : {
            createdAt: {
              [Op.between]: [startDate, endDate],
            },
          };

    // Get daily counts
    const dailyCounts = await HomeEnquiry.findAll({
      where: whereCondition,
      attributes: [
        [fn("DATE", col("createdAt")), "date"],
        [fn("COUNT", col("id")), "count"],
      ],
      group: [fn("DATE", col("createdAt"))],
      order: [[fn("DATE", col("createdAt")), "ASC"]],
    });

    // Get status counts
    const statusCounts = await HomeEnquiry.findAll({
      where: type && type !== "all" ? { formType: type } : {},
      attributes: ["status", [fn("COUNT", col("id")), "count"]],
      group: ["status"],
      order: [[literal("count"), "DESC"]],
    });

    // Format data for Chart.js
    const labels = [];
    const data = [];

    // Create a map of dates to counts
    const dateMap = new Map();
    dailyCounts.forEach((item) => {
      dateMap.set(
        item.getDataValue("date"),
        Number.parseInt(item.getDataValue("count"))
      );
    });

    // Fill in all dates in the range
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split("T")[0];
      labels.push(dateStr);
      data.push(dateMap.get(dateStr) || 0);
    }

    res.status(200).json({
      success: true,
      data: {
        labels,
        datasets: [
          {
            label:
              type && type !== "all"
                ? `${type.charAt(0).toUpperCase() + type.slice(1)} Enquiries`
                : "All Home Enquiries",
            data,
            backgroundColor: "rgba(67, 97, 238, 0.5)",
            borderColor: "rgba(67, 97, 238, 1)",
            borderWidth: 1,
          },
        ],
        statusData: statusCounts.map((item) => ({
          status: item.status || "pending",
          count: Number.parseInt(item.getDataValue("count")),
        })),
      },
    });
  } catch (error) {
    console.error(`Error fetching ${type || "all"} chart data:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chart data",
    });
  }
});

// GET a single home enquiry by ID
router.get("/id/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await HomeEnquiry.findByPk(id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    res.status(200).json({
      success: true,
      data: enquiry,
    });
  } catch (error) {
    console.error("Error fetching home enquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch enquiry",
    });
  }
});

// UPDATE a home enquiry
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await HomeEnquiry.findByPk(id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    // Update enquiry
    await enquiry.update(req.body);

    res.status(200).json({
      success: true,
      message: "Enquiry updated successfully",
      data: enquiry,
    });
  } catch (error) {
    console.error("Error updating home enquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update enquiry",
    });
  }
});

// DELETE a home enquiry
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await HomeEnquiry.findByPk(id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    // Delete enquiry
    await enquiry.destroy();

    res.status(200).json({
      success: true,
      message: "Enquiry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting home enquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete enquiry",
    });
  }
});

// Format date for email
const formatDate = (dateString) => {
  if (!dateString) return "Not specified";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

module.exports = router;
