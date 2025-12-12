#!/usr/bin/env node
// cli.js - Dapbase CLI v1.0.0 - Full featured

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

const DAPBASE_DIR = path.join(process.cwd(), 'Dapbase');
const CONFIG_PATH = path.join(DAPBASE_DIR, 'dapbase.config.json');
const BACKUPS_DIR = path.join(process.cwd(), 'backups');

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.log(chalk.red('Dapbase not initialized. Run: npx dapbase init'));
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// 1. init command
async function init() {
  console.log(chalk.cyan.bold('\nWelcome to Dapbase v1.0.0\n'));

  const answers = await inquirer.prompt([
    { name: 'username', message: 'Your name/author:', default: 'admin' },
    { name: 'project', message: 'Project name:', default: path.basename(process.cwd()) },
    { name: 'defaultDatabase', message: 'Default database name:', default: 'main' },
    { name: 'autoBackup', type: 'confirm', message: 'Enable automatic backups?', default: true },
    { name: 'environment', type: 'list', message: 'Environment:', choices: ['development', 'production'], default: 'development' }
  ]);

  fs.mkdirSync(DAPBASE_DIR, { recursive: true });

  const config = {
    username: answers.username,
    project: answers.project,
    createdAt: new Date().toISOString(),
    version: "1.0.0",
    description: "Dapbase configuration",
    environment: answers.environment,
    defaultDatabase: answers.defaultDatabase,
    logLevel: "info",
    autoBackup: answers.autoBackup,
    backupPath: "./backups",
    maxFileSizeMB: 10
  };

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log(chalk.green('✓ Created dapbase.config.json'));

  // Copy connection file
  const connSource = path.join(__dirname, 'templates', 'dapbase.connection.js');
  const connDest = path.join(DAPBASE_DIR, 'dapbase.connection.js');
  fs.copyFileSync(connSource, connDest);
  console.log(chalk.green('✓ Created dapbase.connection.js'));

  // Create default database folder
  const dbPath = path.join(DAPBASE_DIR, answers.defaultDatabase);
  fs.mkdirSync(dbPath, { recursive: true });
  console.log(chalk.green(`✓ Created default database folder: ${answers.defaultDatabase}/`));

  if (answers.autoBackup) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    console.log(chalk.green('✓ Created ./backups folder'));
  }

  console.log(chalk.bold.cyan('\nDapbase initialized successfully!'));
  console.log(chalk.gray('\nNext steps:'));
  console.log(`   const db = require("./Dapbase/dapbase.connection.js");`);
  console.log(`   await db.use("${answers.defaultDatabase}");`);
  console.log('   await db.createTable("users", { name: "text" });');
}

// 2. list command
function list() {
  const config = loadConfig();
  const databases = fs.readdirSync(DAPBASE_DIR).filter(f => fs.statSync(path.join(DAPBASE_DIR, f)).isDirectory());

  console.log(chalk.cyan.bold(`\nDapbase in project: ${config.project}`));
  console.log(chalk.gray(`Default database: ${config.defaultDatabase}\n`));

  if (databases.length === 0) {
    console.log(chalk.yellow('No databases found. Create one with folders in Dapbase/'));
    return;
  }

  databases.forEach(dbName => {
    const dbPath = path.join(DAPBASE_DIR, dbName);
    const tables = fs.readdirSync(dbPath).filter(f => f.endsWith('.table'));
    console.log(chalk.bold(dbName === config.defaultDatabase ? '★ ' + dbName : '  ' + dbName));
    if (tables.length === 0) {
      console.log(chalk.gray('   (no tables)'));
    } else {
      tables.forEach(t => console.log(chalk.gray(`   • ${t.replace('.table', '')}`)));
    }
  });
}

// 3. use command
function use(dbName) {
  const config = loadConfig();
  const dbPath = path.join(DAPBASE_DIR, dbName);
  if (!fs.existsSync(dbPath)) {
    console.log(chalk.red(`Database "${dbName}" not found`));
    process.exit(1);
  }
  config.defaultDatabase = dbName;
  saveConfig(config);
  console.log(chalk.green(`Default database set to: ${dbName}`));
}

// 4. backup command
function backup() {
  const config = loadConfig();
  if (!config.autoBackup) {
    console.log(chalk.yellow('Auto-backup is disabled in config'));
  }

  if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
  const backupFile = path.join(BACKUPS_DIR, `dapbase-backup-${timestamp}.zip`);

  // Simple zip using Node (or you can use archiver later)
  console.log(chalk.yellow('Backup feature coming in v1.1 — folder ready!'));
  console.log(`   Your data is safe in ./Dapbase and can be zipped manually`);
}

// Main router
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'init':
    init();
    break;
  case 'list':
    list();
    break;
  case 'use':
    if (!args[1]) {
      console.log(chalk.red('Usage: npx dapbase use <database-name>'));
      process.exit(1);
    }
    use(args[1]);
    break;
  case 'backup':
    backup();
    break;
  default:
    console.log(chalk.cyan('Dapbase CLI v1.0.0'));
    console.log('Commands:');
    console.log('  init          - Setup Dapbase in this project');
    console.log('  list          - List all databases and tables');
    console.log('  use <db>      - Set default database');
    console.log('  backup        - Create a backup (v1.1 coming soon)');
    break;
}