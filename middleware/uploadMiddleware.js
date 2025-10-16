import multer from "multer";
import path from "path";
import fs from "fs";

// Create upload folders if they don't exist
const createFolder = (folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/others";
    if (file.mimetype.startsWith("image")) folder = "uploads/images";
    else if (file.mimetype.startsWith("video")) folder = "uploads/videos";

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
