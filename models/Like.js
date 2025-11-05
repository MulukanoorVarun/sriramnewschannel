import { DataTypes } from "sequelize";
import sequelize from "../src/config/db.js";
import News from "./News.js";

const Like = sequelize.define("Like", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: true }, // nullable for guests
  guestId: { type: DataTypes.STRING, allowNull: true },
  newsId: { type: DataTypes.INTEGER, allowNull: false },
});

News.hasMany(Like, { foreignKey: "newsId", onDelete: "CASCADE" });
Like.belongsTo(News, { foreignKey: "newsId" });

export default Like;
