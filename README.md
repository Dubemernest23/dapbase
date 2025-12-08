# Dapbase

**A dead-simple, file-based, folder-visible database for Node.js**

No server. No binaries. No black boxes.  
Your data lives in plain files inside a `Dapbase/` folder you can open, read, backup, or edit by hand if you ever want to.

Perfect for small apps, prototypes, CLI tools, learning, or when you just want full control.

## Features

- Zero dependencies
- 100% transparent — see every table as files
- Multiple databases in one project (just create folders)
- Familiar SQL-like API (coming step by step)
- Works offline, in production, or in the browser (future)
- Created for learning and simplicity

## Installation

```bash
npm install dapbase

This single command automatically creates a Dapbase/ folder in your project with everything you need.
Folder Structure After Install
textDapbase/
├── dapbase.config.json          ← Global configuration (feel free to edit)
├── dapbase.connection.js        ← Import this in your app (your database connection)
└── your_database_name/          ← Create a folder = create a new database
    └── (your tables will appear here as readable files)

Create Your First Database
Just make a folder inside Dapbase/ — that’s it!
Bashmkdir Dapbase/blog_db
mkdir Dapbase/users_db
Each folder is a completely independent database.

Usage
// app.js or server.js
const db = require('./Dapbase/dapbase.connection.js');

// Switch to a database (folder must exist)
await db.use('blog_db');

// Create a table
await db.createTable('posts', {
  id: 'int',
  title: 'text',
  content: 'text',
  published: 'boolean'
});

// Insert data
await db.insert('posts', {
  id: 1,
  title: 'Hello Dapbase',
  content: 'This is my first post!',
  published: true
});

// Query data
const allPosts = await db.select('posts');
console.log(allPosts);

// With condition
const published = await db.select('posts', { where: { published: true } });

API (Current & Upcoming)
Method,Status,Description
db.use(name),Working,Switch to a database folder
db.createTable(),Working,Create a new table with schema
db.insert(),Working,Insert a row
db.select(),Working,Read rows (with optional where)
db.update(),Soon,Update rows
db.delete(),Soon,Delete rows
db.dropTable(),Soon,Remove a table
db.listTables(),Soon,List all tables in current database

Philosophy
“If you can’t ls your database and understand it, it’s not simple enough.”
Dapbase is intentionally minimal.
There is no process, no port, no background daemon.
Your data is just files in a folder — exactly where you expect it.

Roadmap

 Auto-create Dapbase/ folder on install
 Multiple databases via folders
 Human-readable .table files (JSON or custom format)
 Full CRUD operations
 Simple querying (where, limit, order by)
 Optional encryption per database
 Backup with one command: zip -r backup.zip Dapbase/
 Web UI to browse your databases (optional extra package)

Contributing
    This project is built slowly, intentionally, and in public.
    Every commit is a learning moment.
    Ideas, issues, suggestions, and pull requests are not just welcome — they’re celebrated.

Author
    Duby

License
MIT © 2025 Your Name

Dapbase — Because your data should be yours.
Simple. Visible. Yours.
    
