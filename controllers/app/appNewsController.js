import { Op, Sequelize } from "sequelize";
import News from "../../models/News.js";
import Bookmark from "../../models/Bookmark.js";
import { sendResponse } from "../../src/utils/responseHelper.js";
import NewsView from "../../models/NewsView.js";

/**
 * Helper to build full file URLs
 */
const buildFileUrl = (req, filePath) => {
  if (!filePath) return null;
  return `${req.protocol}://${req.get("host")}/${filePath}`;
};

/**
 * 📰 Get all news (supports pagination, category filter, search)
 * Adds: is_bookmarked and views_count for logged-in or guest users
 */
export const getAllNews = async (req, res) => {
  try {
    const userId = req.user?.id || 0;
    const guestId = req.headers["x-guest-id"] || null; // guest identifier
    console.log("Current userId:", userId, "GuestId:", guestId);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { categoryId, search } = req.query;

    const whereClause = {};
    if (categoryId) whereClause.categoryId = categoryId;
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const totalCount = await News.count({ where: whereClause });

    const news = await News.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      attributes: {
        include: [
          // Check if bookmarked
          [
            Sequelize.literal(`CASE 
              WHEN EXISTS (
                SELECT 1 FROM ${Bookmark.getTableName()} AS bookmark
                WHERE bookmark.newsId = News.id
                AND bookmark.userId = ${userId}
              ) THEN TRUE ELSE FALSE END`),
            "is_bookmarked",
          ],
          // Count total views
          [
            Sequelize.literal(`(
              SELECT COUNT(*) FROM ${NewsView.getTableName()} AS nv
              WHERE nv.newsId = News.id
            )`),
            "views_count",
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
        views_count: parseInt(json.views_count) || 0,
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
 * 📰 Get a single news by ID (adds is_bookmarked)
 */

export const getNewsById = async (req, res) => {
  try {
    const userId = req.user?.id || 0;
    const guestId = req.headers["x-guest-id"] || null; // guest identifier from mobile app
    console.log("Current userId:", userId, "GuestId:", guestId);

    const { id } = req.params;

    const news = await News.findByPk(id, {
      attributes: {
        include: [
          [
            Sequelize.literal(`CASE 
              WHEN EXISTS (
                SELECT 1 FROM ${Bookmark.getTableName()} AS bookmark
                WHERE bookmark.newsId = News.id
                AND bookmark.userId = ${userId || 0}
              ) THEN TRUE ELSE FALSE END`),
            "is_bookmarked",
          ],
        ],
      },
    });

    if (!news)
      return sendResponse(res, false, "News not found", null, 404);

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

    // Optionally, calculate total views dynamically
    const totalViews = await NewsView.count({ where: { newsId: id } });

    const json = news.toJSON();
    const formattedNews = {
      ...json,
      imageUrl: buildFileUrl(req, json.imageUrl),
      videoUrl: buildFileUrl(req, json.videoUrl),
      is_bookmarked: Boolean(json.is_bookmarked),
      views_count: totalViews,
    };

    return sendResponse(res, true, "News fetched successfully", formattedNews);
  } catch (err) {
    console.error("Error in getNewsById:", err);
    return sendResponse(res, false, err.message, null, 500);
  }
};

