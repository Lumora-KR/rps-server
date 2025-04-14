const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const TourPackageDetail = require("../models/TourPackageDetail");
const CarRentalDetail = require("../models/CarRentalDetail");
const HotelEnquiry = require("../models/HotelEnquiry");
const ContactForm = require("../models/ContactForm");
const { sequelize } = require("../config/database");

// Dashboard Stats
router.get("/stats", async (req, res) => {
  try {
    // Get counts from all models
    const [tourPackageDetails, carRentalDetails, hotelEnquiries, contactForms] =
      await Promise.all([
        TourPackageDetail.count(),
        CarRentalDetail.count(),
        HotelEnquiry.count(),
        ContactForm.count(),
      ]);

    res.status(200).json({
      success: true,
      data: {
        tourPackageDetails,
        carRentalDetails,
        hotelEnquiries,
        contactForms,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
      error: error.message,
    });
  }
});

// Chart Data
router.get("/chart-data", async (req, res) => {
  try {
    // Get the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Function to get daily counts for a model
    const getDailyCounts = async (model) => {
      const results = await model.findAll({
        attributes: [
          [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
        group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
        order: [[sequelize.fn("DATE", sequelize.col("createdAt")), "ASC"]],
        raw: true,
      });

      return results;
    };

    // Get data for all models
    const [
      tourPackageDetailsData,
      carRentalDetailsData,
      hotelEnquiriesData,
      contactFormsData,
    ] = await Promise.all([
      getDailyCounts(TourPackageDetail),
      getDailyCounts(CarRentalDetail),
      getDailyCounts(HotelEnquiry),
      getDailyCounts(ContactForm),
    ]);

    // Generate dates for the last 30 days
    const dates = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      dates.push(d.toISOString().split("T")[0]);
    }

    // Format data for each model
    const formatChartData = (modelData) => {
      const dataMap = new Map();
      modelData.forEach((item) => {
        dataMap.set(item.date, Number.parseInt(item.count));
      });

      return {
        labels: dates,
        datasets: [
          {
            data: dates.map((date) => dataMap.get(date) || 0),
          },
        ],
      };
    };

    res.status(200).json({
      success: true,
      data: {
        tourPackageDetails: formatChartData(tourPackageDetailsData),
        carRentalDetails: formatChartData(carRentalDetailsData),
        hotelEnquiries: formatChartData(hotelEnquiriesData),
        contactForms: formatChartData(contactFormsData),
      },
    });
  } catch (error) {
    console.error("Error fetching chart data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chart data",
      error: error.message,
    });
  }
});

// Recent Activity
router.get("/recent-activity", async (req, res) => {
  try {
    // Get recent entries from all models
    const [tourPackageDetails, carRentalDetails, hotelEnquiries, contactForms] =
      await Promise.all([
        TourPackageDetail.findAll({
          order: [["createdAt", "DESC"]],
          limit: 5,
          raw: true,
        }),
        CarRentalDetail.findAll({
          order: [["createdAt", "DESC"]],
          limit: 5,
          raw: true,
        }),
        HotelEnquiry.findAll({
          order: [["createdAt", "DESC"]],
          limit: 5,
          raw: true,
        }),
        ContactForm.findAll({
          order: [["createdAt", "DESC"]],
          limit: 5,
          raw: true,
        }),
      ]);

    // Format activity data
    const formatActivity = (items, type, messagePrefix) => {
      return items.map((item) => ({
        type,
        message: `${messagePrefix} from ${item.name || "Anonymous"}`,
        timestamp: item.createdAt,
      }));
    };

    // Combine and sort all activities
    const allActivities = [
      ...formatActivity(
        tourPackageDetails,
        "tourPackage",
        "New tour package enquiry"
      ),
      ...formatActivity(
        carRentalDetails,
        "carRental",
        "New car rental enquiry"
      ),
      ...formatActivity(hotelEnquiries, "hotel", "New hotel booking enquiry"),
      ...formatActivity(contactForms, "contact", "New contact form submission"),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Return the 10 most recent activities
    res.status(200).json({
      success: true,
      data: allActivities.slice(0, 10),
    });
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent activity",
      error: error.message,
    });
  }
});

// Quick Stats
router.get("/quick-stats", async (req, res) => {
  try {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get start of week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    // Get start of month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Function to get counts for different time periods
    const getCounts = async (model) => {
      const [todayCount, weekCount, monthCount] = await Promise.all([
        model.count({
          where: {
            createdAt: {
              [Op.gte]: today,
            },
          },
        }),
        model.count({
          where: {
            createdAt: {
              [Op.gte]: startOfWeek,
            },
          },
        }),
        model.count({
          where: {
            createdAt: {
              [Op.gte]: startOfMonth,
            },
          },
        }),
      ]);

      return { todayCount, weekCount, monthCount };
    };

    // Get counts for all models
    const [tourCounts, carCounts, hotelCounts, contactCounts] =
      await Promise.all([
        getCounts(TourPackageDetail),
        getCounts(CarRentalDetail),
        getCounts(HotelEnquiry),
        getCounts(ContactForm),
      ]);

    // Calculate totals
    const todayTotal =
      tourCounts.todayCount +
      carCounts.todayCount +
      hotelCounts.todayCount +
      contactCounts.todayCount;

    const weekTotal =
      tourCounts.weekCount +
      carCounts.weekCount +
      hotelCounts.weekCount +
      contactCounts.weekCount;

    const monthTotal =
      tourCounts.monthCount +
      carCounts.monthCount +
      hotelCounts.monthCount +
      contactCounts.monthCount;

    // Calculate conversion rate (example: percentage of enquiries that have status 'confirmed')
    let confirmedCount = 0;
    let totalCount = 0;

    try {
      // Try to get counts of confirmed status from models that have status field
      const [tourConfirmed, carConfirmed, hotelConfirmed] = await Promise.all([
        TourPackageDetail.count({
          where: { status: "confirmed" },
        }),
        CarRentalDetail.count({
          where: { status: "confirmed" },
        }),
        HotelEnquiry.count({
          where: { status: "confirmed" },
        }),
      ]);

      confirmedCount = tourConfirmed + carConfirmed + hotelConfirmed;
      totalCount =
        (await TourPackageDetail.count()) +
        (await CarRentalDetail.count()) +
        (await HotelEnquiry.count());
    } catch (error) {
      console.error("Error calculating conversion rate:", error);
      // If status field doesn't exist in some models, use a default value
      confirmedCount = 0;
      totalCount = 1; // Avoid division by zero
    }

    const conversionRate =
      totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        today: todayTotal,
        week: weekTotal,
        month: monthTotal,
        conversionRate,
      },
    });
  } catch (error) {
    console.error("Error fetching quick stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch quick stats",
      error: error.message,
    });
  }
});

module.exports = router;
