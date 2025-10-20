import Banner from "../../models/Banner.js";
import News from "../../models/News.js";
import { sendResponse } from "../../src/utils/responseHelper.js";
import fs from "fs";
import path from "path";

// ✅ Helper for file path
const buildFileUrl = (req, filePath) => {
  if (!filePath) return null;
  return `${req.protocol}://${req.get("host")}/${filePath}`;
};

// 🟢 Add Banner (Admin)
export const addBanner = async (req, res) => {
  try {
    const { newsId, url, isActive } = req.body;
    let bannerImage = null;

    if (!req.file)
      return sendResponse(res, false, "Banner image is required", null, 400);

    if (newsId && url)
      return sendResponse(res, false, "Provide either newsId or url, not both", null, 400);

    if (!newsId && !url)
      return sendResponse(res, false, "Either newsId or url is required", null, 400);

    if (newsId) {
      const news = await News.findByPk(newsId);
      if (!news)
        return sendResponse(res, false, "Invalid newsId: news not found", null, 404);
    }

    bannerImage = `uploads/banners/${req.file.filename}`;

    const banner = await Banner.create({
      bannerImage,
      newsId: newsId || null,
      url: url || null,
      isActive: isActive ?? true,
    });

    return sendResponse(res, true, "Banner added successfully", banner, 201);
  } catch (err) {
    console.error("Error in addBanner:", err);
    return sendResponse(res, false, err.message, null, 500);
  }
};

// 🟡 Get All Banners (Admin)
export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.findAll({
      order: [["createdAt", "DESC"]],
      include: [{ model: News, as: "news", attributes: ["id", "title"] }],
    });

    const formatted = banners.map((b) => ({
      ...b.toJSON(),
      bannerImage: buildFileUrl(req, b.bannerImage),
    }));

    return sendResponse(res, true, "Banners fetched successfully", formatted);
  } catch (err) {
    console.error("Error in getAllBanners:", err);
    return sendResponse(res, false, err.message, null, 500);
  }
};

// 🟠 Update Banner (Admin)
export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { newsId, url, isActive } = req.body;

    const banner = await Banner.findByPk(id);
    if (!banner) return sendResponse(res, false, "Banner not found", null, 404);

    if (newsId && url)
      return sendResponse(res, false, "Provide either newsId or url, not both", null, 400);

    if (newsId) {
      const news = await News.findByPk(newsId);
      if (!news)
        return sendResponse(res, false, "Invalid newsId: news not found", null, 404);
    }

    if (req.file) {
      // Delete old image
      if (banner.bannerImage && fs.existsSync(banner.bannerImage)) {
        fs.unlinkSync(banner.bannerImage);
      }
      banner.bannerImage = `uploads/banners/${req.file.filename}`;
    }

    banner.newsId = newsId || null;
    banner.url = url || null;
    if (isActive !== undefined) banner.isActive = isActive;

    await banner.save();

    return sendResponse(res, true, "Banner updated successfully", banner);
  } catch (err) {
    console.error("Error in updateBanner:", err);
    return sendResponse(res, false, err.message, null, 500);
  }
};

// 🔴 Delete Banner (Admin)
export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByPk(id);

    if (!banner) return sendResponse(res, false, "Banner not found", null, 404);

    if (banner.bannerImage && fs.existsSync(banner.bannerImage)) {
      fs.unlinkSync(banner.bannerImage);
    }

    await banner.destroy();
    return sendResponse(res, true, "Banner deleted successfully", null);
  } catch (err) {
    console.error("Error in deleteBanner:", err);
    return sendResponse(res, false, err.message, null, 500);
  }
};
