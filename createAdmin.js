import dotenv from "dotenv";
import sequelize from "./src/config/db.js";
import User from "./models/User.js";
import bcrypt from "bcrypt";

dotenv.config();

const createAdmin = async () => {
  try {
    await sequelize.sync(); // make sure DB tables exist

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const [admin, created] = await User.findOrCreate({
      where: { email: "admin@gmail.com" },
      defaults: {
        name: "Super Admin",
        email: "admin@gmail.com",
        mobile: "9999999999",
        password: hashedPassword,
        role: "admin", // important
      },
    });

    if (created) {
      console.log("Admin created successfully ✅");
    } else {
      console.log("Admin already exists");
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();
