import Banner from "../../models/Banner.js";
import News from "../../models/News.js";
import { sendResponse } from "../../src/utils/responseHelper.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { formatDate } from "../../src/utils/dateHelper.js"; // ✅ using date helper
import { buildFileUrl, getAbsoluteFilePath, deleteFileIfExists } from "../../src/utils/fileHelper.js";


// 🟢 Add Banner (Admin)
export const addBanner = async (req, res) => {
  try {
    const { newsId, url, isActive } = req.body;

    // Validation
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

    const bannerImage = `uploads/banners/${req.file.filename}`;

    const banner = await Banner.create({
      bannerImage,
      newsId: newsId || null,
      url: url || null,
      isActive: isActive ?? true,
    });

    return sendResponse(res, true, "Banner added successfully", {
      // ...banner.toJSON(),
      // bannerImage: buildFileUrl(req, bannerImage),
    }, 201);
  } catch (err) {
    console.error("Add Banner Error:", err.message);

    if (err.name === "SequelizeValidationError" || err.name === "SequelizeDatabaseError") {
      return sendResponse(res, false, "Invalid banner input. Please check the data.", null, 400);
    }

    return sendResponse(res, false, "Failed to add banner. Please try again.", null, 500);
  }
};

// 🟡 Get All Banners (Admin)
export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.findAll({
      order: [["createdAt", "DESC"]],
      include: [{ model: News, as: "news", attributes: ["id", "title"] }],
    });

    if (!banners || banners.length === 0)
      return sendResponse(res, false, "No banners found", []);

    const formatted = banners.map((b) => ({
      id: b.id,
      newsId: b.newsId,
      url: b.url,
      isActive: b.isActive,
      bannerImage: buildFileUrl(req, b.bannerImage),
      createdAt: formatDate(b.createdAt),
      updatedAt: formatDate(b.updatedAt),
      news: b.news ? { id: b.news.id, title: b.news.title } : null,
    }));

    return sendResponse(res, true, "Banners fetched successfully", formatted);
  } catch (err) {
    console.error("Error in getAllBanners:", err);
    return sendResponse(
      res,
      false,
      "Failed to fetch banners. Please try again later.",
      null,
      500
    );
  }
};

// 🟢 Get Banner By ID (Admin)
export const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByPk(id, {
      include: [{ model: News, as: "news", attributes: ["id", "title"] }],
    });

    if (!banner)
      return sendResponse(res, false, "Banner not found", null, 404);

    const formattedBanner = {
      id: banner.id,
      newsId: banner.newsId,
      url: banner.url,
      isActive: banner.isActive,
      bannerImage: buildFileUrl(req, banner.bannerImage),
      createdAt: formatDate(banner.createdAt),
      updatedAt: formatDate(banner.updatedAt),
      news: banner.news ? { id: banner.news.id, title: banner.news.title } : null,
    };

    return sendResponse(res, true, "Banner fetched successfully", formattedBanner);
  } catch (err) {
    console.error("Error in getBannerById:", err);
    return sendResponse(res, false, "Failed to fetch banner details", null, 500);
  }
};

// 🟠 Update Banner (Admin)
export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { newsId, url, isActive } = req.body;

    const banner = await Banner.findByPk(id);
    if (!banner)
      return sendResponse(res, false, "Banner not found", null, 404);

    if (newsId && url)
      return sendResponse(res, false, "Provide either newsId or url, not both", null, 400);

    if (newsId) {
      const news = await News.findByPk(newsId);
      if (!news)
        return sendResponse(res, false, "Invalid newsId: news not found", null, 404);
    }

    if (req.file) {
      try {
        const oldFilePath = getAbsoluteFilePath(banner.bannerImage);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } catch (fsErr) {
        console.warn("Failed to delete old banner image:", fsErr.message);
      }
      banner.bannerImage = `uploads/banners/${req.file.filename}`;
    }

    banner.newsId = newsId || null;
    banner.url = url || null;
    if (isActive !== undefined) banner.isActive = isActive;

    await banner.save();

    return sendResponse(res, true, "Banner updated successfully", {
      ...banner.toJSON(),
      bannerImage: buildFileUrl(req, banner.bannerImage),
    });
  } catch (err) {
    console.error("Update Banner Error:", err.message);

    if (err.name === "SequelizeValidationError" || err.name === "SequelizeDatabaseError") {
      return sendResponse(res, false, "Invalid input or missing required fields", null, 400);
    }

    return sendResponse(res, false, "Failed to update banner. Please try again.", null, 500);
  }
};

// 🔴 Delete Banner (Admin)
export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByPk(id);
    if (!banner)
      return sendResponse(res, false, "Banner not found", null, 404);

    try {
      const filePath = getAbsoluteFilePath(banner.bannerImage);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fsErr) {
      console.warn("Failed to delete banner image:", fsErr.message);
    }

    await banner.destroy();
    return sendResponse(res, true, "Banner deleted successfully");
  } catch (err) {
    console.error("Delete Banner Error:", err.message);

    if (err.name === "SequelizeForeignKeyConstraintError") {
      return sendResponse(
        res,
        false,
        "Cannot delete this banner because it is linked to other records.",
        null,
        400
      );
    }

    return sendResponse(res, false, "Failed to delete banner. Please try again.", null, 500);
  }
};
