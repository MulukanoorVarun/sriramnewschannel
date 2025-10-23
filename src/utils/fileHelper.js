import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// ✅ Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Build full public URL for a file
 * @param {Object} req - Express request object
 * @param {string} filePath - Relative file path (e.g., 'uploads/banners/banner.jpg')
 * @returns {string|null} - Full URL or null if filePath not provided
 */
export const buildFileUrl = (req, filePath) => {
  if (!filePath) return null;
  const cleanPath = filePath.replace(/^src[\\/]/, "");
  return `${req.protocol}://${req.get("host")}/${cleanPath}`;
};

/**
 * Resolve absolute file system path from relative path
 * @param {string} relativePath - Relative file path
 * @returns {string} - Absolute path
 */
export const getAbsoluteFilePath = (relativePath) => {
  return path.join(__dirname, "../../", relativePath);
};

/**
 * Safely delete a file if it exists
 * @param {string} relativePath - Relative file path
 */
export const deleteFileIfExists = (relativePath) => {
  try {
    const absolutePath = getAbsoluteFilePath(relativePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (err) {
    console.warn("Failed to delete file:", err.message);
  }
};
