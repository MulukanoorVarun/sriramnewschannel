import { DataTypes } from "sequelize";
import sequelize from "../src/config/db.js";
import News from "./News.js";

const Like = sequelize.define("Like", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  newsId: { type: DataTypes.INTEGER, allowNull: false },
});

News.hasMany(Like, { foreignKey: "newsId", onDelete: "CASCADE" });
Like.belongsTo(News, { foreignKey: "newsId" });

export default Like;
