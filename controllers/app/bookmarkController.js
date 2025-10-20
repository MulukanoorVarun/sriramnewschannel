// controllers/bookmarkController.js
import Bookmark from "../../models/Bookmark.js";
import News from "../../models/News.js";
import User from "../../models/User.js";
import { sendResponse } from "../../src/utils/responseHelper.js";

// ✅ Toggle bookmark (add/remove)
export const toggleBookmark = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { newsId } = req.body;

    if (!userId) {
      return sendResponse(res, false, "Unauthorized", null, 401);
    }

    if (!newsId) {
      return sendResponse(res, false, "newsId is required", null, 400);
    }

    // ✅ Check if news exists (avoid invalid FK errors)
    const newsExists = await News.findByPk(newsId);
    if (!newsExists) {
      return sendResponse(res, false, "News not found for the provided newsId", null, 404);
    }

    // ✅ Check if bookmark already exists
    const existing = await Bookmark.findOne({ where: { userId, newsId } });

    if (existing) {
      // Remove bookmark
      await existing.destroy();
      return sendResponse(res, true, "Bookmark removed successfully", {
        is_bookmarked: false,
      });
    } else {
      // Add new bookmark
      await Bookmark.create({ userId, newsId });
      return sendResponse(res, true, "News bookmarked successfully", {
        is_bookmarked: true,
      });
    }
  } catch (err) {
    console.error("Error in toggleBookmark:", err);
    return sendResponse(res, false, err.message, null, 500);
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

