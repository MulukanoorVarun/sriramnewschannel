// controllers/dashboardController.js
import News from "../../models/News.js";
import Category from "../../models/Category.js";
import User from "../../models/User.js";
import { sendResponse } from "../../src/utils/responseHelper.js";

export const getDashboardStats = async (req, res) => {
  try {
    const [newsCount, categoryCount, userCount] = await Promise.all([
      News.count(),
      Category.count(),
      User.count(),
    ]);

    const data = {
      totalNews: newsCount,
      totalCategories: categoryCount,
      totalUsers: userCount,
    };

    return sendResponse(res, true, "Dashboard stats fetched successfully", data);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return sendResponse(
      res,
      false,
      "Failed to fetch dashboard stats",
      { error: error.message },
      500
    );
  }
};

