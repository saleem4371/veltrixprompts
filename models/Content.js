const mongoose = require("mongoose");

const ContentSchema = new mongoose.Schema(
  {
    hero: { type: Object, default: {} },
    products: { type: Object, default: {} },
    how: { type: Object, default: {} },
    testimonials: { type: Array, default: [] },
    faq: { type: Object, default: {} },
    site: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Content", ContentSchema);