import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { sendResponse } from "../src/utils/responseHelper.js";
dotenv.config();

/**
 * Middleware to authenticate a user based on JWT token.
 * If valid, sets req.user = decoded token payload.
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return sendResponse(res, false, "Authorization header missing", null, 403);
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return sendResponse(res, false, "Token missing or malformed", null, 403);
    }

    // 🔑 Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = decoded;

    // Optional: Debug log (safe to remove in production)
    console.log("✅ Authenticated user:", req.user);

    next();
  } catch (err) {
    console.error("Authentication error:", err.message);

    // Token verification failure (expired / invalid / malformed)
    return sendResponse(
      res,
      false,
      err.name === "TokenExpiredError"
        ? "Session expired. Please log in again."
        : "Invalid or expired token",
      null,
      401
    );
  }
};

export const optionalAuthenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return next(); // guest, no token

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user if token is valid
  } catch (err) {
    console.warn("Invalid token, continuing as guest");
  }

  next();
};

/**
 * Middleware to allow only admins
 */
export const adminOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }

  next();
};

/**
 * Middleware factory to allow specific roles
 * Usage: authorizeRoles("admin", "editor")
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};
