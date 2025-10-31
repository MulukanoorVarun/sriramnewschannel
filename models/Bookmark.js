// models/Bookmark.js
import { DataTypes } from "sequelize";
import sequelize from "../src/config/db.js";
import User from "./User.js";
import News from "./News.js";

const Bookmark = sequelize.define(
  "Bookmark",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    newsId: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: "bookmarks",
    timestamps: true,
  }
);

// ✅ Relations

// Each bookmark belongs to a single News
Bookmark.belongsTo(News, { foreignKey: "newsId", onDelete: "CASCADE" });

// Each bookmark may belong to a User
Bookmark.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });

// News can have many bookmarks
News.hasMany(Bookmark, { foreignKey: "newsId" });

// User can have many bookmarks
User.hasMany(Bookmark, { foreignKey: "userId" });

// (Optional) You can still keep many-to-many if you use User.findAll({ include: [News] })
User.belongsToMany(News, { through: Bookmark, foreignKey: "userId" });
News.belongsToMany(User, { through: Bookmark, foreignKey: "newsId" });

export default Bookmark;

