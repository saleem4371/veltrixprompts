const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  username: String,
  passwordHash: String,
});

module.exports = mongoose.model("Admin", AdminSchema);