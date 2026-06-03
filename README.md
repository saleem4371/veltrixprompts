# Veltrix Prompts — Node.js

AI Prompt Packs landing site with persistent server-side content management.

## Quick start

```bash
npm install
node setup.js        # creates data/admin.json with hashed password
npm start            # runs on http://localhost:3000
```

## File structure

```
veltrix-node/
├── server.js          # Express server + all API routes
├── setup.js           # Run once to initialise admin credentials
├── package.json
├── data/
│   ├── content.json   # All page content (auto-updated by admin panel)
│   └── admin.json     # Admin credentials (hashed password)
├── views/
│   └── index.html     # Page template
└── public/
    ├── style.css      # All styles
    └── app.js         # Client-side JS (fetches content, admin panel)
```

## Deployment (cPanel / shared hosting)

1. Upload all files maintaining the folder structure above
2. Make sure Node.js is enabled in cPanel (most hosts support it)
3. Set the entry point to `server.js`
4. Run `npm install` via the cPanel terminal or SSH
5. Run `node setup.js` once to create admin credentials
6. Start the app — point your domain to port 3000 (or configure reverse proxy)

## Deployment (VPS / cloud)

```bash
git clone / upload files
cd veltrix-node
npm install
node setup.js
# For production, use PM2:
npm install -g pm2
pm2 start server.js --name veltrix
pm2 save
pm2 startup
```

## Environment variables

Set these in production:

| Variable         | Default                              | Description              |
|------------------|--------------------------------------|--------------------------|
| PORT             | 3000                                 | Server port              |
| SESSION_SECRET   | veltrix-secret-change-in-production  | Express session secret   |
| ADMIN_USER       | admin                                | Used by setup.js only    |
| ADMIN_PASS       | veltrix2025                          | Used by setup.js only    |

## Admin panel

- Visit `yourdomain.com?admin=true` to show the settings gear (bottom right)
- Default credentials: **admin / veltrix2025**
- Change credentials immediately via admin panel → Site tab → Admin credentials
- All content changes save to `data/content.json` and are immediately live for all visitors

## API routes

| Method | Route                            | Auth | Description                  |
|--------|----------------------------------|------|------------------------------|
| GET    | /api/content                     | No   | Returns full content JSON    |
| POST   | /api/admin/login                 | No   | Login, returns session       |
| POST   | /api/admin/logout                | Yes  | Destroys session             |
| GET    | /api/admin/session               | Yes  | Check session status         |
| POST   | /api/admin/hero                  | Yes  | Update hero content          |
| POST   | /api/admin/product/:id           | Yes  | Update a product card        |
| POST   | /api/admin/how                   | Yes  | Update how-it-works section  |
| POST   | /api/admin/testimonials/add      | Yes  | Add one testimonial          |
| POST   | /api/admin/testimonials/:idx     | Yes  | Update testimonial by index  |
| DELETE | /api/admin/testimonials/:idx     | Yes  | Delete testimonial by index  |
| POST   | /api/admin/faq                   | Yes  | Update FAQ                   |
| POST   | /api/admin/site                  | Yes  | Update site/footer settings  |
| POST   | /api/admin/credentials           | Yes  | Change username/password     |
