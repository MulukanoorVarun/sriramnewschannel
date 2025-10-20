// middleware/uploadMiddleware.js
import multer from "multer";
import fs from "fs";
import path from "path";

const createFolder = (folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/others";

    // ✅ Force banners to go in /banners folder
    if (req.originalUrl.includes("/admin/banners")) {
      folder = "uploads/banners";
    } else if (file.mimetype.startsWith("image")) {
      folder = "uploads/images";
    } else if (file.mimetype.startsWith("video")) {
      folder = "uploads/videos";
    }

    createFolder(folder);
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });
export default upload;
