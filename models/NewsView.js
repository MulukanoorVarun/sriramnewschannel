// models/NewsView.js
import { DataTypes } from "sequelize";
import sequelize from "../src/config/db.js";
import News from "./News.js";
import User from "./User.js";

const NewsView = sequelize.define("NewsView", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  newsId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER },       // nullable for guests
  guestId: { type: DataTypes.STRING },       // optional: some guest identifier (like sessionId or IP)
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: "news_views",
  timestamps: false,
});

News.hasMany(NewsView, { foreignKey: "newsId" });
NewsView.belongsTo(News, { foreignKey: "newsId" });

export default NewsView;
