import Banner from "../../models/Banner.js";
import News from "../../models/News.js";
import { sendResponse } from "../../src/utils/responseHelper.js";
import { fileURLToPath } from "url";
import path from "path";

// Setup for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Helper to build full URL for static files
const buildFileUrl = (req, filePath) => {
  if (!filePath) return null;
  const cleanPath = filePath.replace(/^src[\\/]/, ""); // remove any "src/"
  return `${req.protocol}://${req.get("host")}/${cleanPath}`;
};

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
