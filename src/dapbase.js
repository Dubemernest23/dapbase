#!/usr/bin/env node

const commander = require('commander');
const fs = require('fs');
const path = require('path');
const prompt = require('prompt-sync')({ sigint: true });

commander
  .command('init')
  .description('Initialize Dapbase in your project')
  .action(() => {
    console.log('Welcome to Dapbase Init! Let\'s set up your database.\n');

    const username = prompt('Author name (default: admin): ') || 'admin';
    const project = prompt('Project name (default: my-project): ') || 'my-project';
    const defaultDatabase = prompt('Default database name (default: main): ') || 'main';
    const environment = prompt('Environment (development/production, default: development): ') || 'development';
    const logLevel = prompt('Log level (info/debug/error, default: info): ') || 'info';
    const maxFileSizeMB = parseInt(prompt('Max file size in MB (default: 10): ') || '10', 10);
    const autoBackup = prompt('Enable auto-backup? (yes/no, default: yes): ') !== 'no';
    const backupPath = autoBackup ? prompt('Backup path (default: ./backups): ') || './backups' : null;

    const config = {
      username,
      project,
      createdAt: new Date().toISOString(),
      version: '1.0.0',
      description: 'Dapbase configuration file. Edit as needed.',
      environment,
      defaultDatabase,
      logLevel,
      autoBackup,
      backupPath: autoBackup ? backupPath : null,
      maxFileSizeMB,
    };

    const targetDir = path.join(process.cwd(), 'Dapbase');
    if (fs.existsSync(targetDir)) {
      console.log('Dapbase folder already exists. Skipping folder creation.');
    } else {
      fs.mkdirSync(targetDir);
      console.log('Created ./Dapbase');
    }

    // Copy connection.js from templates
    const templatesDir = path.join(__dirname, '..', 'templates');
    const connFrom = path.join(templatesDir, 'dapbase.connection.js');
    const connTo = path.join(targetDir, 'dapbase.connection.js');
    fs.copyFileSync(connFrom, connTo);
    console.log('Created ./Dapbase/dapbase.connection.js');

    // Write config.json
    const configPath = path.join(targetDir, 'dapbase.config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('Created ./Dapbase/dapbase.config.json');

    if (autoBackup) {
      const fullBackupPath = path.join(process.cwd(), backupPath);
      fs.mkdirSync(fullBackupPath, { recursive: true });
      console.log(`Created backups folder at ${backupPath}`);
    }

    console.log('\nDapbase initialized! Import it in your app.js:');
    console.log('const db = require("./Dapbase/dapbase.connection.js");');
    console.log('Edit ./Dapbase/dapbase.config.json anytime.');
  });

commander.parse(process.argv);