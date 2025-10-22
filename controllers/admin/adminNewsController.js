import News from "../../models/News.js";
import Category from "../../models/Category.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sendResponse } from "../../src/utils/responseHelper.js";

// Setup for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Build full public URL for file paths
const buildFileUrl = (req, filePath) => {
  if (!filePath) return null;
  const cleanPath = filePath.replace(/^src[\\/]/, "").replace(/\\/g, "/");
  return `${req.protocol}://${req.get("host")}/${cleanPath}`;
};

// ✅ Resolve absolute file path
const getAbsoluteFilePath = (relativePath) => {
  return path.join(__dirname, "../../", relativePath);
};

// 🟢 Create News
export const createNews = async (req, res) => {
  try {
    const { title, description, categoryId } = req.body;

    const imageFile = req.files?.image?.[0];
    const videoFile = req.files?.video?.[0];

    const imagePath = imageFile ? `uploads/news/${imageFile.filename}` : null;
    const videoPath = videoFile ? `uploads/news/${videoFile.filename}` : null;

    const news = await News.create({
      title,
      description,
      imageUrl: imagePath,
      videoUrl: videoPath,
      categoryId,
    });

    return sendResponse(res, true, "News created successfully", {
      ...news.toJSON(),
      imageUrl: buildFileUrl(req, imagePath),
      videoUrl: buildFileUrl(req, videoPath),
    }, 201);
  } catch (err) {
    console.error("Error in createNews:", err);
    return sendResponse(res, false, err.message, null, 500);
  }
};

// 🟡 Get All News
export const getAllNews = async (req, res) => {
  try {
    const news = await News.findAll({
      include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]],
    });

    const formattedNews = news.map((item) => ({
      ...item.toJSON(),
      imageUrl: buildFileUrl(req, item.imageUrl),
      videoUrl: buildFileUrl(req, item.videoUrl),
    }));

    return sendResponse(res, true, "News fetched successfully", formattedNews);
  } catch (err) {
    console.error("Error in getAllNews:", err);
    return sendResponse(res, false, err.message, null, 500);
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
    console.error("Error in getNewsById:", err);
    return sendResponse(res, false, err.message, null, 500);
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

    // Delete old files if new ones are uploaded
    if (imageFile && news.imageUrl) {
      const oldImagePath = getAbsoluteFilePath(news.imageUrl);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }
    if (videoFile && news.videoUrl) {
      const oldVideoPath = getAbsoluteFilePath(news.videoUrl);
      if (fs.existsSync(oldVideoPath)) fs.unlinkSync(oldVideoPath);
    }

    const imagePath = imageFile ? `uploads/news/${imageFile.filename}` : news.imageUrl;
    const videoPath = videoFile ? `uploads/news/${videoFile.filename}` : news.videoUrl;

    news.title = title;
    news.description = description;
    news.imageUrl = imagePath;
    news.videoUrl = videoPath;
    news.categoryId = categoryId;

    await news.save();

    const formattedNews = {
      ...news.toJSON(),
      imageUrl: buildFileUrl(req, imagePath),
      videoUrl: buildFileUrl(req, videoPath),
    };

    return sendResponse(res, true, "News updated successfully", formattedNews);
  } catch (err) {
    console.error("Error in updateNews:", err);
    return sendResponse(res, false, err.message, null, 500);
  }
};

// 🔴 Delete News
export const deleteNews = async (req, res) => {
  try {
    const news = await News.findByPk(req.params.id);
    if (!news) return sendResponse(res, false, "News not found", null, 404);

    if (news.imageUrl) {
      const imgPath = getAbsoluteFilePath(news.imageUrl);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    if (news.videoUrl) {
      const vidPath = getAbsoluteFilePath(news.videoUrl);
      if (fs.existsSync(vidPath)) fs.unlinkSync(vidPath);
    }

    await news.destroy();
    return sendResponse(res, true, "News deleted successfully", null);
  } catch (err) {
    console.error("Error in deleteNews:", err);
    return sendResponse(res, false, err.message, null, 500);
  }
};
