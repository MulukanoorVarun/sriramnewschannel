import express from "express";
import { authenticate, authorizeRoles } from "../../middleware/authMiddleware.js";
import upload from "../../middleware/uploadMiddleware.js";
import { 
  addBanner, 
  getAllBanners, 
  updateBanner, 
  deleteBanner ,
  getBannerById
} from "../../controllers/admin/adminBannerController.js";

const router = express.Router();

// ✅ Admin Routes (use centralized upload middleware)
router.post("/", authenticate, authorizeRoles("admin"), upload.single("bannerImage"), addBanner);
router.get("/", authenticate, authorizeRoles("admin"), getAllBanners);
router.get("/:id", authenticate, authorizeRoles("admin"), getBannerById);
router.put("/:id", authenticate, authorizeRoles("admin"), upload.single("bannerImage"), updateBanner);
router.delete("/:id", authenticate, authorizeRoles("admin"), deleteBanner);

export default router;

