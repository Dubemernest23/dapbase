#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.join(process.cwd(), 'Dapbase');
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

if (fs.existsSync(TARGET_DIR)) {
  console.log('Dapbase folder already exists — skipping setup.');
  process.exit(0);
}

fs.mkdirSync(TARGET_DIR);
console.log('Created: ./Dapbase');

['dapbase.config.json', 'dapbase.connection.js'].forEach(file => {
  const src = path.join(TEMPLATES_DIR, file);
  const dest = path.join(TARGET_DIR, file);
  fs.copyFileSync(src, dest);
  console.log(`Created: ./Dapbase/${file}`);
});

console.log('\nDapbase is ready!');
console.log('Next: Create a folder inside Dapbase/ to make your first database');
console.log('Example: mkdir Dapbase/myapp_db\n');