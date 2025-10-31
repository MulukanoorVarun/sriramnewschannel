import { DataTypes } from "sequelize";
import sequelize from "../src/config/db.js";

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: "unique_email",
    validate: {
      isEmail: {
        msg: "Please enter a valid email address",
      },
    },
  },

  mobile: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: "unique_mobile",
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  role: {
    type: DataTypes.ENUM("admin", "staff", "user"),
    defaultValue: "user",
  },

  profilePic: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },

  // ✅ For Forgot Password / OTP Flow
  otp: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },

  otpExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },

  // ✅ For Token-Based Authentication (Refresh Tokens)
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: "users",
  timestamps: true, // Adds createdAt & updatedAt
});

export default User;
