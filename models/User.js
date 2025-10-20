// models/User.js
import { DataTypes } from "sequelize";
import sequelize from "../src/config/db.js";

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: "unique_email",
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: "unique_mobile",
  },
  password: { type: DataTypes.STRING, allowNull: false },
  role: {
    type: DataTypes.ENUM("admin", "staff", "user"),
    defaultValue: "user"
  },

  profilePic: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
});

export default User;
