import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./src/config/db.js"; // corrected path

// Import Routes
// App routes
import authRoutes from "./routes/app/authRoutes.js";
import appCategoryRoutes from "./routes/app/appCategoryRoutes.js";
import appNewsRoutes from "./routes/app/appNewsRoutes.js";
import bookmarkRoutes from "./routes/app/bookmarkRoutes.js";
import userProfileRoutes from "./routes/app/userProfileRoutes.js";
import bannerRoutes from "./routes/app/bannerRoutes.js";

// Admin routes
import adminAuthRoutes from "./routes/admin/adminAuthRoutes.js";
import adminCategoryRoutes from "./routes/admin/adminCategoryRoutes.js";
import adminNewsRoutes from "./routes/admin/adminNewsRoutes.js";
import adminUserRoutes from "./routes/admin/adminUserRoutes.js";
import adminBannerRoutes from "./routes/admin/adminBannerRoutes.js";
import adminStaffRoutes from "./routes/admin/adminStaffRoutes.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ======= App Routes =======
app.use("/api/auth", authRoutes);                  // App user register/login
app.use("/api/app/categories", appCategoryRoutes); // App: get categories
app.use("/api/app/news", appNewsRoutes);           // App: get news
app.use("/api/app/bookmarks", bookmarkRoutes);     // App: get bookmarks
app.use("/api/app/user", userProfileRoutes);     // App: get bookmarks
app.use("/api/app/banners", bannerRoutes);     // App: get banners

// ======= Admin Routes =======
app.use("/api/admin/auth", adminAuthRoutes);          // Admin login
app.use("/api/admin/categories", adminCategoryRoutes); // Admin: CRUD categories
app.use("/api/admin/news", adminNewsRoutes);           // Admin: CRUD news
app.use("/api/admin/banners", adminBannerRoutes);           // Admin: CRUD Banner
app.use("/api/admin/users", adminUserRoutes);          // Admin: CRUD User
app.use("/api/admin/staff", adminStaffRoutes);          // Admin: CRUD banners

// Sync database
sequelize.sync({ alter: true }).then(() => console.log("Database synced ✅"));

export default app;
