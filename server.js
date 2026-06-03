'use strict';

const express  = require('express');
const session  = require('express-session');
const helmet   = require('helmet');
const bcrypt   = require('bcryptjs');
const fs       = require('fs');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── PATHS ─────────────────────────────────────────────
const DATA_DIR    = path.join(__dirname, 'data');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const ADMIN_FILE   = path.join(DATA_DIR, 'admin.json');

// ── HELPERS ───────────────────────────────────────────
function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}
function getContent() { return readJSON(CONTENT_FILE); }
function getAdmin()   { return readJSON(ADMIN_FILE); }

// ── MIDDLEWARE ────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'veltrix-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 8 * 60 * 60 * 1000 } // 8 hours
}));

// ── TEMPLATE ENGINE (inline, no deps) ────────────────
app.set('views', path.join(__dirname, 'views'));
app.engine('html', (filePath, options, cb) => {
  fs.readFile(filePath, 'utf8', (err, str) => {
    if (err) return cb(err);
    // {{var}} substitution
    const rendered = str.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      const keys = key.trim().split('.');
      let val = options;
      for (const k of keys) val = val?.[k];
      return val !== undefined ? val : '';
    });
    cb(null, rendered);
  });
});
app.set('view engine', 'html');

// ── AUTH MIDDLEWARE ───────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// ── ROUTES ────────────────────────────────────────────

// Home page — server-renders all content from JSON
app.get('/', (req, res) => {
  const c = getContent();
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Content API — public read
app.get('/api/content', (req, res) => {
  res.json(getContent());
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = getAdmin();
  if (username !== admin.username) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const match = await bcrypt.compare(password, admin.passwordHash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });
  req.session.isAdmin = true;
  req.session.username = username;
  res.json({ ok: true, username });
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// Check session
app.get('/api/admin/session', (req, res) => {
  if (req.session?.isAdmin) res.json({ ok: true, username: req.session.username });
  else res.status(401).json({ ok: false });
});

// Update hero content
app.post('/api/admin/hero', requireAuth, (req, res) => {
  const c = getContent();
  c.hero = { ...c.hero, ...req.body };
  writeJSON(CONTENT_FILE, c);
  res.json({ ok: true });
});

// Update a single product
app.post('/api/admin/product/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const c = getContent();
  if (!c.products[id]) return res.status(404).json({ error: 'Product not found' });
  // feats comes as newline-separated string → convert to array
  if (typeof req.body.feats === 'string') {
    req.body.feats = req.body.feats.split('\n').map(l => l.trim()).filter(Boolean);
  }
  // live comes as string from form
  if (typeof req.body.live === 'string') {
    req.body.live = req.body.live === 'true';
  }
  c.products[id] = { ...c.products[id], ...req.body };
  writeJSON(CONTENT_FILE, c);
  res.json({ ok: true, product: c.products[id] });
});

// Update how-it-works
app.post('/api/admin/how', requireAuth, (req, res) => {
  const c = getContent();
  c.how = { ...c.how, ...req.body };
  writeJSON(CONTENT_FILE, c);
  res.json({ ok: true });
});

// Get all testimonials
app.get('/api/admin/testimonials', requireAuth, (req, res) => {
  res.json(getContent().testimonials);
});

// Replace all testimonials (full array save)
app.post('/api/admin/testimonials', requireAuth, (req, res) => {
  const c = getContent();
  if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Array expected' });
  c.testimonials = req.body;
  writeJSON(CONTENT_FILE, c);
  res.json({ ok: true, testimonials: c.testimonials });
});

// Add one testimonial
app.post('/api/admin/testimonials/add', requireAuth, (req, res) => {
  const c = getContent();
  const { q, n, r, p } = req.body;
  if (!q || !n) return res.status(400).json({ error: 'Quote and name required' });
  c.testimonials.push({ q, n, r: r || '', p: p || '' });
  writeJSON(CONTENT_FILE, c);
  res.json({ ok: true, testimonials: c.testimonials });
});

// Update one testimonial by index
app.post('/api/admin/testimonials/:idx', requireAuth, (req, res) => {
  const c = getContent();
  const idx = parseInt(req.params.idx);
  if (isNaN(idx) || idx < 0 || idx >= c.testimonials.length) {
    return res.status(404).json({ error: 'Not found' });
  }
  c.testimonials[idx] = { ...c.testimonials[idx], ...req.body };
  writeJSON(CONTENT_FILE, c);
  res.json({ ok: true, testimonials: c.testimonials });
});

// Delete one testimonial
app.delete('/api/admin/testimonials/:idx', requireAuth, (req, res) => {
  const c = getContent();
  const idx = parseInt(req.params.idx);
  if (isNaN(idx) || idx < 0 || idx >= c.testimonials.length) {
    return res.status(404).json({ error: 'Not found' });
  }
  c.testimonials.splice(idx, 1);
  writeJSON(CONTENT_FILE, c);
  res.json({ ok: true, testimonials: c.testimonials });
});

// Update FAQ
app.post('/api/admin/faq', requireAuth, (req, res) => {
  const c = getContent();
  c.faq = { ...c.faq, ...req.body };
  writeJSON(CONTENT_FILE, c);
  res.json({ ok: true });
});

// Update site settings
app.post('/api/admin/site', requireAuth, (req, res) => {
  const c = getContent();
  c.site = { ...c.site, ...req.body };
  writeJSON(CONTENT_FILE, c);
  res.json({ ok: true });
});

// Update admin credentials
app.post('/api/admin/credentials', requireAuth, async (req, res) => {
  const { username, password } = req.body;
  const admin = getAdmin();
  if (username) admin.username = username;
  if (password) admin.passwordHash = await bcrypt.hash(password, 10);
  writeJSON(ADMIN_FILE, admin);
  if (username) req.session.username = username;
  res.json({ ok: true });
});

// ── START ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Veltrix Prompts running on http://localhost:${PORT}`);
});
