import Banner from "../../models/Banner.js";
import News from "../../models/News.js";
import { sendResponse } from "../../src/utils/responseHelper.js";
import { fileURLToPath } from "url";
import path from "path";
import { buildFileUrl, deleteFileIfExists } from "../../src/utils/fileHelper.js";

// 🟢 Get Active Banners (for App)
export const getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.findAll({
      where: { isActive: true },
      order: [["createdAt", "DESC"]],
      include: [{ model: News, as: "news", attributes: ["id", "title"] }],
    });

    const formatted = banners.map((b) => ({
      id: b.id,
      bannerImage: buildFileUrl(req, b.bannerImage),
      newsId: b.newsId,
      url: b.url,
      isActive: b.isActive,
      news: b.news ? { id: b.news.id, title: b.news.title } : null,
    }));

    return sendResponse(res, true, "Banners fetched successfully", formatted);
  } catch (err) {
    console.error("Error in getActiveBanners:", err);
    return sendResponse(res, false, err.message, null, 500);
  }
};
