require("dotenv").config();

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Admin = require("./models/Admin");
const Content = require("./models/Content");

(async () => {
  try {
    console.log("Mongo URI:", process.env.MONGO_URI);

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    // ── ADMIN MIGRATION ──
    const adminPath = path.join(__dirname, "data", "admin.json");
    const adminData = JSON.parse(fs.readFileSync(adminPath, "utf8"));

    await Admin.deleteMany(); // IMPORTANT (avoid duplicates)
    await Admin.create(adminData);

    // ── CONTENT MIGRATION ──
    const contentPath = path.join(__dirname, "data", "content.json");
    const contentData = JSON.parse(fs.readFileSync(contentPath, "utf8"));

    await Content.deleteMany(); // IMPORTANT
    await Content.create(contentData);

    console.log("✅ Migration Done Successfully");

    process.exit(0);
  } catch (err) {
    console.error("❌ Migration Error:", err);
    process.exit(1);
  }
})();