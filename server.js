'use strict';

require("dotenv").config();

const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const Content = require("./models/Content");
const Admin = require("./models/Admin");

const app = express();
const PORT = process.env.PORT || 3000;

// ── DB CONNECT ─────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

// ── MIDDLEWARE ─────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 8 * 60 * 60 * 1000 }
}));

// ── AUTH ───────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session?.isAdmin) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

// ── HELPERS ────────────────────────────────
async function getContent() {
  let content = await Content.findOne();
  if (!content) {
    content = await Content.create({});
  }
  return content;
}

// ── ROUTES ─────────────────────────────────

// Home
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// PUBLIC CONTENT
app.get("/api/content", async (req, res) => {
  const content = await getContent();
  res.json(content);
});

// ── ADMIN LOGIN ────────────────────────────
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });
  if (!admin) return res.status(401).json({ error: "Invalid credentials" });

  const match = await bcrypt.compare(password, admin.passwordHash);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  req.session.isAdmin = true;
  req.session.username = username;

  res.json({ ok: true });
});

// LOGOUT
app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// SESSION CHECK
app.get("/api/admin/session", (req, res) => {
  if (req.session?.isAdmin) {
    return res.json({ ok: true, username: req.session.username });
  }
  res.status(401).json({ ok: false });
});

// ── UPDATE HERO ────────────────────────────
app.post("/api/admin/hero", requireAuth, async (req, res) => {
  const c = await getContent();

  c.hero = { ...c.hero, ...req.body };
  await c.save();

  res.json({ ok: true });
});

// ── UPDATE PRODUCT ─────────────────────────
app.post("/api/admin/product/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const c = await getContent();

  if (!c.products[id]) {
    return res.status(404).json({ error: "Product not found" });
  }

  if (typeof req.body.feats === "string") {
    req.body.feats = req.body.feats
      .split("\n")
      .map(v => v.trim())
      .filter(Boolean);
  }

  if (typeof req.body.live === "string") {
    req.body.live = req.body.live === "true";
  }

  c.products[id] = {
    ...c.products[id],
    ...req.body,
  };

  await c.save();

  res.json({ ok: true, product: c.products[id] });
});

// ── HOW IT WORKS ───────────────────────────
app.post("/api/admin/how", requireAuth, async (req, res) => {
  const c = await getContent();

  c.how = { ...c.how, ...req.body };
  await c.save();

  res.json({ ok: true });
});

// ── TESTIMONIALS ───────────────────────────
app.get("/api/admin/testimonials", requireAuth, async (req, res) => {
  const c = await getContent();
  res.json(c.testimonials);
});

app.post("/api/admin/testimonials", requireAuth, async (req, res) => {
  const c = await getContent();

  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: "Array expected" });
  }

  c.testimonials = req.body;
  await c.save();

  res.json({ ok: true });
});

app.post("/api/admin/testimonials/add", requireAuth, async (req, res) => {
  const c = await getContent();
  const { q, n, r, p } = req.body;

  c.testimonials.push({
    q,
    n,
    r: r || "",
    p: p || "",
  });

  await c.save();

  res.json({ ok: true });
});

app.delete("/api/admin/testimonials/:idx", requireAuth, async (req, res) => {
  const c = await getContent();
  const idx = parseInt(req.params.idx);

  c.testimonials.splice(idx, 1);
  await c.save();

  res.json({ ok: true });
});

// ── FAQ ─────────────────────────────────────
app.post("/api/admin/faq", requireAuth, async (req, res) => {
  const c = await getContent();

  c.faq = { ...c.faq, ...req.body };
  await c.save();

  res.json({ ok: true });
});

// ── SITE SETTINGS ──────────────────────────
app.post("/api/admin/site", requireAuth, async (req, res) => {
  const c = await getContent();

  c.site = { ...c.site, ...req.body };
  await c.save();

  res.json({ ok: true });
});

// ── START SERVER ───────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});