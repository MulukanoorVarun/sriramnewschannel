import News from "../../models/News.js";
import Category from "../../models/Category.js";
import User from "../../models/User.js";
import { sendResponse } from "../../src/utils/responseHelper.js";
import { buildFileUrl, deleteFileIfExists } from "../../src/utils/fileHelper.js";
import { formatDate } from "../../src/utils/dateHelper.js";
import { Op } from "sequelize";


// 🟢 Create News
export const createNews = async (req, res) => {
  try {
    const { title, description, categoryId } = req.body;

    const imageFile = req.files?.image?.[0];
    const videoFile = req.files?.video?.[0];

    // 🧩 Validation
    if (!title || !description)
      return sendResponse(res, false, "Title and description are required", null, 400);

    if ((!imageFile && !videoFile) || (imageFile && videoFile)) {
      return sendResponse(
        res,
        false,
        "Please upload either an image OR a video (not both).",
        null,
        400
      );
    }

    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category)
        return sendResponse(res, false, "Invalid categoryId", null, 404);
    }

    // ✅ Create news
    const news = await News.create({
      title,
      description,
      categoryId: categoryId || null,
      imageUrl: imageFile ? `uploads/news/${imageFile.filename}` : null,
      videoUrl: videoFile ? `uploads/news/${videoFile.filename}` : null,
    });

    const newsData = {
      ...news.toJSON(),
      imageUrl: buildFileUrl(req, news.imageUrl),
      videoUrl: buildFileUrl(req, news.videoUrl),
    };

    // 🚀 Respond to Admin Immediately
    sendResponse(res, true, "News created successfully", newsData, 201);

    // 🔥 Send Notifications Asynchronously (non-blocking)
    (async () => {
      try {
        const users = await User.findAll({
          attributes: ["fcmToken"],
          where: { fcmToken: { [Op.ne]: null } },
        });

        const tokens = users.map((u) => u.fcmToken).filter(Boolean);
        if (!tokens.length) return;

        const message = {
          notification: { title, body: description },
          data: {
            newsId: news.id.toString(),
            title,
            description,
          },
        };

        const chunkSize = 500; // FCM limit
        for (let i = 0; i < tokens.length; i += chunkSize) {
          const chunk = tokens.slice(i, i + chunkSize);
          await admin.messaging().sendEachForMulticast({ ...message, tokens: chunk });
        }

        console.log(`📢 News notification sent to ${tokens.length} users.`);
      } catch (notifyErr) {
        console.error("⚠️ Notification Error:", notifyErr);
      }
    })(); // ← runs in background

  } catch (err) {
    console.error("Create News Error:", err);
    return sendResponse(
      res,
      false,
      "Failed to create news. Please try again.",
      null,
      500
    );
  }
};

// 🟡 Get All News with Filters + Pagination
export const getAllNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { search, categoryId, recent } = req.query;

    // 🔍 Filters setup
    const whereClause = {};

    // Search filter (title or description)
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    // Category filter
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    // Sorting (recent = true means latest first)
    const order = recent === "true" ? [["createdAt", "DESC"]] : [["createdAt", "ASC"]];

    // ✅ Fetch data
    const { count, rows } = await News.findAndCountAll({
      where: whereClause,
      include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
      order,
      limit,
      offset,
    });

    if (!rows || rows.length === 0) {
      return sendResponse(
        res,
        false,
        "No news found",
        {
          totalRecords: 0,
          totalPages: 0,
          currentPage: page,
          pageSize: limit,
          hasNextPage: false,
          hasPrevPage: false,
          news: [],
        },
        404
      );
    }

    // ✅ Format data
    const formattedNews = rows.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: buildFileUrl(req, item.imageUrl),
      videoUrl: buildFileUrl(req, item.videoUrl),
      category: item.category ? { id: item.category.id, name: item.category.name } : null,
      createdAt: formatDate(item.createdAt),
      updatedAt: formatDate(item.updatedAt),
    }));

    const totalPages = Math.ceil(count / limit);

    // ✅ Final response
    return sendResponse(res, true, "News fetched successfully", {
      totalRecords: count,
      totalPages,
      currentPage: page,
      pageSize: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      news: formattedNews,
    });
  } catch (err) {
    console.error("Get All News Error:", err.message);
    return sendResponse(res, false, "Failed to fetch news. Please try again.", null, 500);
  }
};
// 🟠 Get News by ID
export const getNewsById = async (req, res) => {
  try {
    const news = await News.findByPk(req.params.id, {
      include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
    });

    if (!news) return sendResponse(res, false, "News not found", null, 404);

    const formattedNews = {
      ...news.toJSON(),
      imageUrl: buildFileUrl(req, news.imageUrl),
      videoUrl: buildFileUrl(req, news.videoUrl),
    };

    return sendResponse(res, true, "News fetched successfully", formattedNews);

  } catch (err) {
    console.error("Get News by ID Error:", err.message);
    return sendResponse(res, false, "Failed to fetch news details", null, 500);
  }
};

// 🔵 Update News
export const updateNews = async (req, res) => {
  try {
    const { title, description, categoryId } = req.body;
    const news = await News.findByPk(req.params.id);

    if (!news) return sendResponse(res, false, "News not found", null, 404);

    const imageFile = req.files?.image?.[0];
    const videoFile = req.files?.video?.[0];

    // Enforce that at least one new file is provided
    if (!imageFile && !videoFile) 
      return sendResponse(res, false, "Either an image or a video is required to update", null, 400);

    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) return sendResponse(res, false, "Invalid categoryId", null, 404);
    }

    // Delete old files if new ones are uploaded
    if (imageFile) deleteFileIfExists(news.imageUrl);
    if (videoFile) deleteFileIfExists(news.videoUrl);

    news.title = title || news.title;
    news.description = description || news.description;
    news.categoryId = categoryId || news.categoryId;
    news.imageUrl = imageFile ? `uploads/news/${imageFile.filename}` : news.imageUrl;
    news.videoUrl = videoFile ? `uploads/news/${videoFile.filename}` : news.videoUrl;

    await news.save();

    return sendResponse(res, true, "News updated successfully", {
      ...news.toJSON(),
      imageUrl: buildFileUrl(req, news.imageUrl),
      videoUrl: buildFileUrl(req, news.videoUrl),
    });

  } catch (err) {
    console.error("Update News Error:", err.message);
    return sendResponse(res, false, "Failed to update news. Please try again.", null, 500);
  }
};

// 🔴 Delete News
export const deleteNews = async (req, res) => {
  try {
    const news = await News.findByPk(req.params.id);
    if (!news) return sendResponse(res, false, "News not found", null, 404);

    deleteFileIfExists(news.imageUrl);
    deleteFileIfExists(news.videoUrl);

    await news.destroy();
    return sendResponse(res, true, "News deleted successfully", null);

  } catch (err) {
    console.error("Delete News Error:", err.message);
    return sendResponse(res, false, "Failed to delete news. Please try again.", null, 500);
  }
};
