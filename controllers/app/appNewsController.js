import { Op, Sequelize } from "sequelize";
import News from "../../models/News.js";
import Bookmark from "../../models/Bookmark.js";
import NewsView from "../../models/NewsView.js";
import Like from "../../models/Like.js";
import { sendResponse } from "../../src/utils/responseHelper.js";
import { fileURLToPath } from "url";
import path from "path";
import { formatDate } from "../../src/utils/dateHelper.js";
import { buildFileUrl, deleteFileIfExists } from "../../src/utils/fileHelper.js";

/**
 * 📰 Get all news (pagination, filter, search, trending, topmost)
 */
export const getAllNews = async (req, res) => {
  try {
    const userId = req.user?.id || 0;
    const guestId = req.headers["x-guest-id"] || null;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { categoryId, search, type } = req.query;

    let order = [["createdAt", "DESC"]];
    let dateFilter = {};

    // Trending: by recent week + view count
    if (type === "trending") {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      dateFilter = { createdAt: { [Op.gte]: lastWeek } };
      order = [[Sequelize.literal("views_count"), "DESC"]];
    }

    // Topmost: by likes count
    if (type === "topmost") {
      order = [[Sequelize.literal("likes_count"), "DESC"]];
    }

    const whereClause = {
      ...dateFilter,
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? {
            [Op.or]: [
              { title: { [Op.like]: `%${search}%` } },
              { description: { [Op.like]: `%${search}%` } },
            ],
          }
        : {}),
    };

    const totalCount = await News.count({ where: whereClause });

    const news = await News.findAll({
      where: whereClause,
      order,
      limit,
      offset,
      attributes: {
        include: [
          // Bookmark status
          [
            Sequelize.literal(`CASE 
              WHEN EXISTS (
                SELECT 1 FROM ${Bookmark.getTableName()} AS bookmark
                WHERE bookmark.newsId = News.id
                AND bookmark.userId = ${userId}
              ) THEN TRUE ELSE FALSE END`),
            "is_bookmarked",
          ],
          // Like status
          [
            Sequelize.literal(`CASE 
              WHEN EXISTS (
                SELECT 1 FROM ${Like.getTableName()} AS likes
                WHERE likes.newsId = News.id
                AND likes.userId = ${userId}
              ) THEN TRUE ELSE FALSE END`),
            "is_liked",
          ],
          // Views count
          [
            Sequelize.literal(`(
              SELECT COUNT(*) FROM ${NewsView.getTableName()} AS nv
              WHERE nv.newsId = News.id
            )`),
            "views_count",
          ],
          // Likes count
          [
            Sequelize.literal(`(
              SELECT COUNT(*) FROM ${Like.getTableName()} AS lk
              WHERE lk.newsId = News.id
            )`),
            "likes_count",
          ],
        ],
      },
    });

    const formattedNews = news.map((item) => {
      const json = item.toJSON();
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

    const totalPages = Math.ceil(totalCount / limit);

    return sendResponse(res, true, "News fetched successfully", {
      total: totalCount,
      totalPages,
      currentPage: page,
      limit,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
      news: formattedNews,
    });
  } catch (err) {
    console.error("Error in getAllNews:", err);
    return sendResponse(res, false, err.message, null, 500);
  }
};

/**
 * 📰 Get a single news by ID (adds is_bookmarked and tracks views)
 */
export const getNewsById = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const guestId = req.headers["x-guest-id"] || null;
    const { id } = req.params;

    if (!userId && !guestId)
      return sendResponse(res, false, "Unauthorized: missing user or guest ID", null, 401);

    // ✅ Like condition works for both users and guests
    const likeCondition = userId
      ? `likes.userId = ${userId}`
      : `likes.guestId = '${guestId}'`;

    // Only include bookmark condition if user is authenticated
    const bookmarkLiteral = userId
      ? [
          [
            Sequelize.literal(`CASE 
              WHEN EXISTS (
                SELECT 1 FROM ${Bookmark.getTableName()} AS bookmark
                WHERE bookmark.newsId = News.id
                AND bookmark.userId = ${userId}
              ) THEN TRUE ELSE FALSE END`),
            "is_bookmarked",
          ],
        ]
      : [];

    const news = await News.findByPk(id, {
      attributes: {
        include: [
          // ✅ Like status
          [
            Sequelize.literal(`CASE 
              WHEN EXISTS (
                SELECT 1 FROM ${Like.getTableName()} AS likes
                WHERE likes.newsId = News.id
                AND ${likeCondition}
              ) THEN TRUE ELSE FALSE END`),
            "is_liked",
          ],

          // ✅ Bookmark status (only for authenticated users)
          ...bookmarkLiteral,

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
    });

    if (!news) return sendResponse(res, false, "News not found", null, 404);

    // ✅ Track unique view
    const existingView = await NewsView.findOne({
      where: {
        newsId: id,
        ...(userId ? { userId } : { guestId }),
      },
    });

    if (!existingView) {
      await NewsView.create({ newsId: id, userId, guestId });
    }

    const totalViews = await NewsView.count({ where: { newsId: id } });

    const json = news.toJSON();
    const formattedNews = {
      ...json,
      imageUrl: buildFileUrl(req, json.imageUrl),
      videoUrl: buildFileUrl(req, json.videoUrl),
      is_bookmarked: userId ? Boolean(json.is_bookmarked) : false, // guests always false
      is_liked: Boolean(json.is_liked),
      views_count: totalViews,
    };

    return sendResponse(res, true, "News fetched successfully", formattedNews);
  } catch (err) {
    console.error("Error in getNewsById:", err);
    return sendResponse(res, false, err.message, null, 500);
  }
};


/**
 * ❤️ Toggle like / unlike
 */
export const toggleLike = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const guestId = req.headers["x-guest-id"] || null;
    const { newsId } = req.body;

    // Validation
    if (!newsId) {
      return sendResponse(res, false, "newsId is required", null, 400);
    }

    if (!userId && !guestId) {
      return sendResponse(res, false, "Unauthorized: missing user or guest ID", null, 401);
    }

    // Check news existence
    const newsExists = await News.findByPk(newsId);
    if (!newsExists) {
      return sendResponse(res, false, "News not found", null, 404);
    }

    // Check existing like
    const existingLike = await Like.findOne({
      where: {
        newsId,
        ...(userId ? { userId } : { guestId }),
      },
    });

    if (existingLike) {
      // Remove like
      await existingLike.destroy();
      return sendResponse(res, true, "Like removed successfully", { liked: false });
    } else {
      // Add like (only include valid IDs)
      const likeData = { newsId };
      if (userId) likeData.userId = userId;
      if (guestId) likeData.guestId = guestId;

      await Like.create(likeData);
      return sendResponse(res, true, "News liked successfully", { liked: true });
    }
  } catch (err) {
    console.error("Error in toggleLike:", err);

    // Handle foreign key issues gracefully
    if (err.name === "SequelizeDatabaseError" && err.message.includes("foreign key")) {
      return sendResponse(res, false, "Invalid user reference or news reference", null, 400);
    }

    return sendResponse(res, false, err.message || "Internal server error", null, 500);
  }
};

