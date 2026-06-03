/**
 * Run once after cloning: node setup.js
 * Creates admin.json with a properly hashed password.
 * Default: username=admin  password=veltrix2025
 * Change these before running in production.
 */
const bcrypt = require('bcryptjs');
const fs     = require('fs');
const path   = require('path');

const USERNAME = process.env.ADMIN_USER || 'admin';
const PASSWORD = process.env.ADMIN_PASS || 'veltrix2025';

(async () => {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const data = { username: USERNAME, passwordHash: hash };
  fs.writeFileSync(path.join(__dirname, 'data', 'admin.json'), JSON.stringify(data, null, 2));
  console.log(`✅ admin.json created`);
  console.log(`   Username : ${USERNAME}`);
  console.log(`   Password : ${PASSWORD}`);
  console.log(`\n⚠️  Change credentials via the admin panel after first login.`);
})();
