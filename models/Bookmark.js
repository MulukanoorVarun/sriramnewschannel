// models/Bookmark.js
import { DataTypes } from "sequelize";
import sequelize from "../src/config/db.js";
import User from "./User.js";
import News from "./News.js";


const Bookmark = sequelize.define("Bookmark", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  newsId: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: "bookmarks",  // ✅ fixes case-sensitive mismatch
  timestamps: false
});

User.belongsToMany(News, { through: Bookmark, foreignKey: "userId" });
News.belongsToMany(User, { through: Bookmark, foreignKey: "newsId" });

export default Bookmark;
 