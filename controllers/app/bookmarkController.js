// controllers/bookmarkController.js
import Bookmark from "../../models/Bookmark.js";
import News from "../../models/News.js";
import User from "../../models/User.js";
import { sendResponse } from "../../src/utils/responseHelper.js";

// ✅ Toggle bookmark (add/remove)
export const toggleBookmark = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from JWT via middleware
    const { newsId } = req.body;

    if (!newsId) {
      return sendResponse(res, false, "newsId is required", null, 400);
    }

    const existing = await Bookmark.findOne({ where: { userId, newsId } });

    if (existing) {
      await existing.destroy();
      return sendResponse(res, true, "Bookmark removed successfully");
    } else {
      await Bookmark.create({ userId, newsId });
      return sendResponse(res, true, "News bookmarked successfully", null, 201);
    }
  } catch (err) {
    return sendResponse(res, false, "Error toggling bookmark", err.message, 500);
  }
};

// ✅ Get all bookmarks for logged-in user
export const getUserBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findOne({
      where: { id: userId },
      include: {
        model: News,
        through: { attributes: [] }, // hide Bookmark table
      },
    });

    return sendResponse(res, true, "Bookmarks fetched successfully", user.News);
  } catch (err) {
    return sendResponse(res, false, "Error fetching bookmarks", err.message, 500);
  }
};

