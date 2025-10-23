import News from "../../models/News.js";
import Category from "../../models/Category.js";
import { sendResponse } from "../../src/utils/responseHelper.js";
import { buildFileUrl, deleteFileIfExists } from "../../src/utils/fileHelper.js";
import { formatDate } from "../../src/utils/dateHelper.js";

// 🟢 Create News
export const createNews = async (req, res) => {
  try {
    const { title, description, categoryId } = req.body;

    const imageFile = req.files?.image?.[0];
    const videoFile = req.files?.video?.[0];

    if (!title || !description) 
      return sendResponse(res, false, "Title and description are required", null, 400);

    if (!imageFile && !videoFile)
      return sendResponse(res, false, "Either an image or a video is required", null, 400);

    // Optional: validate category
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) return sendResponse(res, false, "Invalid categoryId", null, 404);
    }

    const news = await News.create({
      title,
      description,
      categoryId: categoryId || null,
      imageUrl: imageFile ? `uploads/news/${imageFile.filename}` : null,
      videoUrl: videoFile ? `uploads/news/${videoFile.filename}` : null,
    });

    return sendResponse(res, true, "News created successfully", {
      ...news.toJSON(),
      imageUrl: buildFileUrl(req, news.imageUrl),
      videoUrl: buildFileUrl(req, news.videoUrl),
    }, 201);

  } catch (err) {
    console.error("Create News Error:", err.message);
    return sendResponse(res, false, "Failed to create news. Please try again.", null, 500);
  }
};

// 🟡 Get All News with Pagination
export const getAllNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await News.findAndCountAll({
      include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    if (!rows || rows.length === 0) {
      return sendResponse(res, false, "No news found", {
        totalRecords: 0,
        totalPages: 0,
        currentPage: page,
        pageSize: limit,
        hasNextPage: false,
        hasPrevPage: false,
        news: [],
      }, 404);
    }

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
