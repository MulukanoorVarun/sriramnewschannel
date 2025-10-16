// src/models/Category.js
import { DataTypes } from "sequelize";
import sequelize from "../src/config/db.js";

const Category = sequelize.define("Category", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
});

export default Category;
