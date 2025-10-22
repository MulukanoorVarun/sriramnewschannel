// src/models/News.js
import { DataTypes } from "sequelize";
import sequelize from "../src/config/db.js";
import Category from "./Category.js";

const News = sequelize.define("News", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  imageUrl: { type: DataTypes.STRING },
  videoUrl: { type: DataTypes.STRING },
});

// ✅ Define association with alias "category"
Category.hasMany(News, { foreignKey: "categoryId", as: "news" });
News.belongsTo(Category, { foreignKey: "categoryId", as: "category" });

export default News;
