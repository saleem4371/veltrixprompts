const mongoose = require("mongoose");

// ───────────────────────── HERO ─────────────────────────
const HeroSchema = new mongoose.Schema({
  eyebrow: String,
  h1: String,
  sub: String,
  cta: String,
  navCta: String,

  stat1Num: String,
  stat1Lbl: String,
  stat2Num: String,
  stat2Lbl: String,
  stat3Num: String,
  stat3Lbl: String,

  prodLabel: String,
  prodTitle: String,
  prodIntro: String,
}, { _id: false });


// ───────────────────────── PRODUCT ─────────────────────────
const ProductSchema = new mongoose.Schema({
  name: String,
  tagline: String,
  desc: String,
  count: String,
  feats: [String],
  price: String,
  url: String,
  live: Boolean,
}, { _id: false });


// ───────────────────────── HOW IT WORKS ─────────────────────────
const HowSchema = new mongoose.Schema({
  label: String,
  title: String,

  step1Title: String,
  step1Body: String,

  step2Title: String,
  step2Body: String,

  step3Title: String,
  step3Body: String,
}, { _id: false });


// ───────────────────────── TESTIMONIAL ─────────────────────────
const TestimonialSchema = new mongoose.Schema({
  q: String,
  n: String,
  r: String,
  p: String,
}, { _id: false });


// ───────────────────────── FAQ ITEM ─────────────────────────
const FAQItemSchema = new mongoose.Schema({
  q: String,
  a: String,
}, { _id: false });


// ───────────────────────── FAQ ─────────────────────────
const FAQSchema = new mongoose.Schema({
  label: String,
  title: String,
  items: [FAQItemSchema],
}, { _id: false });


// ───────────────────────── SITE ─────────────────────────
const SiteSchema = new mongoose.Schema({
  testiLabel: String,
  testiTitle: String,
  footerDesc: String,
  email: String,
  footerCopy: String,
  footerDomain: String,
}, { _id: false });


// ───────────────────────── MAIN CONTENT ─────────────────────────
const ContentSchema = new mongoose.Schema(
  {
    hero: HeroSchema,

    products: {
      hr: ProductSchema,
      legal: ProductSchema,
      finance: ProductSchema,
      re: ProductSchema,
    },

    how: HowSchema,

    testimonials: [TestimonialSchema],

    faq: FAQSchema,

    site: SiteSchema,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Content", ContentSchema);
