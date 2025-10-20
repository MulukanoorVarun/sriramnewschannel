import express from "express";
import { getActiveBanners } from "../../controllers/app/bannerController.js";

const router = express.Router();

router.get("/", getActiveBanners);

export default router;
