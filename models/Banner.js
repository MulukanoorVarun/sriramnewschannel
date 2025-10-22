import { DataTypes } from "sequelize";
import sequelize from "../src/config/db.js";
import News from "./News.js";

const Banner = sequelize.define(
  "Banner",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    bannerImage: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Path or URL of banner image",
    },
    newsId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: News,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      comment: "Linked news ID if banner is related to a news article",
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "External or internal URL the banner links to",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Control whether the banner is visible in the app",
    },
  },
  {
    tableName: "banners",
    timestamps: true,
  }
);

// ✅ Define association
Banner.belongsTo(News, {
  foreignKey: "newsId",
  as: "news",
});

export default Banner;
