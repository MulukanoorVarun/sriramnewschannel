import News from "../../models/News.js";
import Category from "../../models/Category.js";
import fs from "fs";
import { sendResponse } from "../../src/utils/responseHelper.js";

// ✅ Helper to build full URLs for file paths
const buildFileUrl = (req, filePath) => {
  if (!filePath) return null;
  return `${req.protocol}://${req.get("host")}/${filePath}`;
};

export const createNews = async (req, res) => {
  try {
    const { title, description, categoryId } = req.body;

    const imageFile = req.files?.image?.[0];
    const videoFile = req.files?.video?.[0];

    const imagePath = imageFile ? imageFile.path.replace(/\\/g, "/") : null;
    const videoPath = videoFile ? videoFile.path.replace(/\\/g, "/") : null;

    const news = await News.create({
      title,
      description,
      imageUrl: imagePath,
      videoUrl: videoPath,
      categoryId,
    });

    return sendResponse(res, true, "News created successfully", news, 201);
  } catch (err) {
    return sendResponse(res, false, err.message, null, 500);
  }
};

export const getAllNews = async (req, res) => {
  try {
    const news = await News.findAll();
    const formattedNews = news.map((item) => ({
      ...item.toJSON(),
      imageUrl: buildFileUrl(req, item.imageUrl),
      videoUrl: buildFileUrl(req, item.videoUrl),
    }));
    return sendResponse(res, true, "News fetched successfully", formattedNews);
  } catch (err) {
    return sendResponse(res, false, err.message, null, 500);
  }
};

export const getNewsById = async (req, res) => {
  try {
    const news = await News.findByPk(req.params.id  );
    if (!news)
      return sendResponse(res, false, "News not found", null, 404);

    const formattedNews = {
      ...news.toJSON(),
      imageUrl: buildFileUrl(req, news.imageUrl),
      videoUrl: buildFileUrl(req, news.videoUrl),
    };

    return sendResponse(res, true, "News fetched successfully", formattedNews);
  } catch (err) {
    return sendResponse(res, false, err.message, null, 500);
  }
};

export const updateNews = async (req, res) => {
  try {
    const { title, description, categoryId } = req.body;
    const news = await News.findByPk(req.params.id);

    if (!news)
      return sendResponse(res, false, "News not found", null, 404);

    const imageFile = req.files?.image?.[0];
    const videoFile = req.files?.video?.[0];

    // Delete old files if new ones are uploaded
    if (imageFile && news.imageUrl && fs.existsSync(news.imageUrl)) {
      fs.unlinkSync(news.imageUrl);
    }
    if (videoFile && news.videoUrl && fs.existsSync(news.videoUrl)) {
      fs.unlinkSync(news.videoUrl);
    }

    const imagePath = imageFile ? imageFile.path.replace(/\\/g, "/") : news.imageUrl;
    const videoPath = videoFile ? videoFile.path.replace(/\\/g, "/") : news.videoUrl;

    news.title = title;
    news.description = description;
    news.imageUrl = imagePath;
    news.videoUrl = videoPath;
    news.categoryId = categoryId;

    await news.save();

    const formattedNews = {
      ...news.toJSON(),
      imageUrl: buildFileUrl(req, news.imageUrl),
      videoUrl: buildFileUrl(req, news.videoUrl),
    };

    return sendResponse(res, true, "News updated successfully", formattedNews);
  } catch (err) {
    return sendResponse(res, false, err.message, null, 500);
  }
};

export const deleteNews = async (req, res) => {
  try {
    const news = await News.findByPk(req.params.id);
    if (!news)
      return sendResponse(res, false, "News not found", null, 404);

    if (news.imageUrl && fs.existsSync(news.imageUrl)) {
      fs.unlinkSync(news.imageUrl);
    }
    if (news.videoUrl && fs.existsSync(news.videoUrl)) {
      fs.unlinkSync(news.videoUrl);
    }

    await news.destroy();
    return sendResponse(res, true, "News deleted successfully");
  } catch (err) {
    return sendResponse(res, false, err.message, null, 500);
  }
};



