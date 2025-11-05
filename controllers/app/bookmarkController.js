// controllers/bookmarkController.js
import Bookmark from "../../models/Bookmark.js";
import News from "../../models/News.js";
import User from "../../models/User.js";
import { sendResponse } from "../../src/utils/responseHelper.js";
import { Op, Sequelize } from "sequelize";
import NewsView from "../../models/NewsView.js";
import Like from "../../models/Like.js";
import { buildFileUrl, deleteFileIfExists } from "../../src/utils/fileHelper.js";
import { formatDate } from "../../src/utils/dateHelper.js";



export const toggleBookmark = async (req, res) => {
  try {
    console.log("🧾 Body:", req.body);
    console.log("🧾 User:", req.user);

    const userId = req.user?.id;
    const { newsId } = req.body;

    // 🧩 Validate required fields
    if (!userId) {
      return sendResponse(res, false, "Unauthorized: missing user ID", null, 401);
    }

    if (!newsId) {
      return sendResponse(res, false, "newsId is required", null, 400);
    }

    // ✅ Ensure the user exists
    const userExists = await User.findByPk(userId);
    if (!userExists) {
      return sendResponse(res, false, "Invalid user: not found", null, 400);
    }

    // ✅ Ensure the news exists
    const newsExists = await News.findByPk(newsId);
    if (!newsExists) {
      return sendResponse(res, false, "News not found for the provided newsId", null, 404);
    }

    // ✅ Check if bookmark already exists
    const existing = await Bookmark.findOne({
      where: {
        newsId,
        userId,
      },
    });

    if (existing) {
      // 🧹 Remove bookmark
      await existing.destroy();
      return sendResponse(res, true, "Bookmark removed successfully", {
        is_bookmarked: false,
      });
    } else {
      // ✅ Add bookmark
      await Bookmark.create({
        newsId,
        userId,
      });
      return sendResponse(res, true, "News bookmarked successfully", {
        is_bookmarked: true,
      });
    }
  } catch (err) {
    console.error("❌ Error in toggleBookmark:", err);

    // Handle DB constraint errors gracefully
    if (err.name === "SequelizeDatabaseError" && err.message.includes("foreign key")) {
      return sendResponse(
        res,
        false,
        "Invalid user or news reference: foreign key constraint failed",
        null,
        400
      );
    }

    return sendResponse(res, false, err.message || "Internal server error", null, 500);
  }
};


// ✅ Get all bookmarks for logged-in user
export const getUserBookmarks = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const guestId = req.headers["x-guest-id"] || null;

    if (!userId && !guestId)
      return sendResponse(res, false, "Unauthorized: missing user or guest ID", null, 401);

    // 🧮 Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 🧩 Dynamic bookmark filter
    const bookmarkWhere = userId ? { userId } : { guestId };

    // 🧾 Get total count
    const totalCount = await Bookmark.count({ where: bookmarkWhere });

    // 🧠 Fetch bookmarked news list
    const bookmarks = await Bookmark.findAll({
      where: bookmarkWhere,
      limit,
      offset,
      include: [
        {
          model: News,
          attributes: {
            include: [
              // ✅ Is Liked
              [
                Sequelize.literal(`CASE 
                  WHEN EXISTS (
                    SELECT 1 FROM ${Like.getTableName()} AS likes
                    WHERE likes.newsId = News.id
                    AND ${
                      userId
                        ? `likes.userId = ${userId}`
                        : `likes.guestId = '${guestId}'`
                    }
                  ) THEN TRUE ELSE FALSE END`),
                "is_liked",
              ],
              // ✅ Is Bookmarked
              [
                Sequelize.literal(`CASE 
                  WHEN EXISTS (
                    SELECT 1 FROM ${Bookmark.getTableName()} AS bm
                    WHERE bm.newsId = News.id
                    AND ${
                      userId
                        ? `bm.userId = ${userId}`
                        : `bm.guestId = '${guestId}'`
                    }
                  ) THEN TRUE ELSE FALSE END`),
                "is_bookmarked",
              ],
              // ✅ Views count
              [
                Sequelize.literal(`(
                  SELECT COUNT(*) FROM ${NewsView.getTableName()} AS nv
                  WHERE nv.newsId = News.id
                )`),
                "views_count",
              ],
              // ✅ Likes count
              [
                Sequelize.literal(`(
                  SELECT COUNT(*) FROM ${Like.getTableName()} AS lk
                  WHERE lk.newsId = News.id
                )`),
                "likes_count",
              ],
            ],
          },
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // 🧱 Format final output
    const formatted = bookmarks.map((b) => {
      const json = b.News?.toJSON?.() || {};
      return {
        ...json,
        imageUrl: buildFileUrl(req, json.imageUrl),
        videoUrl: buildFileUrl(req, json.videoUrl),
        is_bookmarked: Boolean(json.is_bookmarked),
        is_liked: Boolean(json.is_liked),
        views_count: parseInt(json.views_count) || 0,
        likes_count: parseInt(json.likes_count) || 0,
        createdAt: formatDate(json.createdAt),
        updatedAt: formatDate(json.updatedAt),
      };
    });

    // 📄 Pagination meta
    const totalPages = Math.ceil(totalCount / limit);

    return sendResponse(res, true, "Bookmarks fetched successfully", {
      total: totalCount,
      totalPages,
      currentPage: page,
      limit,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
      bookmarks: formatted,
    });
  } catch (err) {
    console.error("Error in getUserBookmarks:", err);
    return sendResponse(res, false, err.message, null, 500);
  }
};


