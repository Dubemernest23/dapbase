# Dapbase v3

**A dead-simple, file-based, folder-visible database for Node.js — now with relationships, schema validation, and encryption**

No server. No binaries. No black boxes.  
Your data lives in plain files inside a `Dapbase/` folder you can open, read, backup, or edit by hand if you ever want to.

Perfect for small apps, prototypes, CLI tools, learning, or when you just want full control.

## 🚀 What's New in v3

- **Schema Validation** - Type checking, constraints, and defaults
- **Relationships** - Foreign keys with cascade delete
- **Encryption** - Field-level AES-256 encryption
- **Backup System** - One-command backups and restores
- **CLI Tool** - Full-featured command-line interface
- **Indexes** - Performance optimization
- **Migrations** - Safe data transformations

## ✨ Features

- **Zero dependencies** (core) - Just Node.js, nothing else
- **100% transparent** - See every table as readable `.table` files
- **Multiple databases** - Just create folders
- **Schema Validation** - Enforce data integrity with constraints
- **Relationships** - Model complex data with foreign keys
- **Encryption** - Optional field-level security
- **CLI Tool** - Full database management from terminal
- **Backup System** - Automatic and manual backups
- **Type Safety** - Runtime type checking with custom validators
- **Migration Support** - Safe data transformations
- **Query Power** - Advanced filtering, joins, and pagination

## 📦 Installation

```bash
npm install dapbase
```

Or try it immediately:

```bash
npx dapbase@latest init
```

The installer automatically creates a `Dapbase/` folder in your project with everything you need.

## 📁 Folder Structure After Install

```
Dapbase/
├── dapbase.config.json          # Global configuration
├── dapbase.connection.js        # Import this in your app
├── .encryption.key              # Auto-generated encryption key (if enabled)
└── main/                        # Your first database (auto-created)
    ├── users.table
    ├── posts.table
    └── ...                      # Your tables appear here as readable files
```

## 🎮 Quick Start

### 1. Initialize Your Project

```bash
npx dapbase init
```

Follow the interactive prompts to set up your database.

### 2. Use in Your Code

```javascript
// app.js
const db = require('./Dapbase/dapbase.connection.js');

// Switch to a database (creates folder if needed)
await db.use('blog_db');

// Create a table with schema validation
await db.createTable('users', {
  name: { type: 'text', required: true },
  email: { type: 'text', unique: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
  age: { type: 'int', min: 0, max: 150 },
  status: { type: 'text', default: 'active' }
});

// Insert data (auto-validates)
await db.insert('users', {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

// Query with advanced filters
const activeUsers = await db.select('users', {
  where: { 
    status: 'active',
    age: { $gt: 20 }
  },
  orderBy: ['name', 'asc'],
  limit: 10
});

console.log(activeUsers);
```

## 📖 Core API

### Database Operations

```javascript
// Switch to/create database
await db.use('database_name');

// List all tables in current database
// (Accessible via table files, but coming soon as API method)
```

### Table Management

```javascript
// Create table with enhanced schema
await db.createTable('table_name', columns, relationships, options);

// Example with relationships
await db.createTable('posts', {
  title: { type: 'text', required: true },
  content: { type: 'text' },
  user_id: { type: 'uuid' }
}, {
  user_id: { foreignTable: 'users', foreignKey: 'id' }
});

// Add column to existing table
await db.addColumn('users', 'bio', { type: 'text', default: '' });

// Remove column
await db.removeColumn('users', 'old_field');
```

### Data Operations

```javascript
// Insert single row
const inserted = await db.insert('users', { name: 'Jane', email: 'jane@example.com' });

// Insert multiple rows
const results = await db.insertMany('users', [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' }
]);

// Query with advanced operators
const users = await db.select('users', {
  where: {
    age: { $gt: 18, $lt: 65 },
    email: { $like: '%@example.com' },
    status: { $in: ['active', 'pending'] }
  },
  orderBy: ['created_at', 'desc'],
  limit: 20,
  offset: 0
});

// Update with validation
await db.update('users', 
  { status: 'inactive' }, 
  { last_login: { $lt: '2024-01-01' } }
);

// Delete with cascade option
await db.delete('users', { status: 'banned' }, { cascade: true });
```

### Relationships & Joins

```javascript
// Create related tables
await db.createTable('users', { name: 'text' });
await db.createTable('posts', {
  title: 'text',
  user_id: 'uuid'
}, {
  user_id: { foreignTable: 'users', foreignKey: 'id' }
});

// Query with join
const postsWithAuthors = await db.select('posts', {
  join: [{
    table: 'users',
    on: { local: 'user_id', foreign: 'id' },
    as: 'author',
    type: 'inner' // or 'left'
  }]
});
```

### Schema Validation Types

```javascript
// Available types and constraints
const columns = {
  // Basic types
  name: { type: 'text' },
  age: { type: 'int' },
  price: { type: 'float' },
  is_active: { type: 'boolean' },
  created_at: { type: 'timestamp' },
  metadata: { type: 'json' },
  uuid_field: { type: 'uuid' },
  
  // With constraints
  email: {
    type: 'text',
    required: true,
    unique: true,
    pattern: '^[^@]+@[^@]+\\.[^@]+$',
    maxLength: 255
  },
  
  password: {
    type: 'text',
    required: true,
    minLength: 8
  },
  
  score: {
    type: 'int',
    min: 0,
    max: 100,
    default: 0
  },
  
  tags: {
    type: 'json',
    default: []
  },
  
  // Function defaults
  created_at: {
    type: 'timestamp',
    default: () => new Date().toISOString()
  }
};
```

## 🔐 Encryption

```javascript
// Create table with encrypted fields
await db.createTable('secrets', {
  public_data: { type: 'text' },
  private_data: { type: 'text' }
}, {}, {
  encryption: {
    key: process.env.ENCRYPTION_KEY, // 32-character key
    fields: ['private_data'] // Only encrypt sensitive fields
  }
});

// Insert data (auto-encrypts)
await db.insert('secrets', {
  public_data: 'This is visible',
  private_data: 'This is encrypted'
});

// Query (auto-decrypts)
const secrets = await db.select('secrets');
console.log(secrets[0].private_data); // "This is encrypted" (decrypted)
```

## 🗃️ Backup & Recovery

```bash
# Create backup
npx dapbase backup

# Create named backup
npx dapbase backup my-backup-2024

# List all backups
npx dapbase list-backups

# Restore from backup
npx dapbase restore backup-2024-01-15.zip

# Restore specific database only
npx dapbase restore backup.zip --only mydb
```

Or programmatically:

```javascript
// Create backup
const backupPath = await db.backup('/path/to/backup.zip');

// Auto-backup every 24 hours (CLI feature)
// Configure in dapbase.config.json
```

## ⚡ Performance Features

```javascript
// Add index for faster queries
await db.addIndex('users', 'email', { type: 'hash', unique: true });
await db.addIndex('posts', 'created_at', { type: 'value' });

// Batch operations for better performance
const users = Array.from({length: 1000}, (_, i) => ({
  name: `User ${i}`,
  email: `user${i}@example.com`
}));

await db.insertMany('users', users, { batchSize: 100 });
```

## 🔄 Migrations

```javascript
// Transform existing data
await db.migrate('users', (row, index, allRows) => {
  // Add full_name by combining first and last
  return {
    ...row,
    full_name: `${row.first_name} ${row.last_name}`.trim()
  };
});

// Backward compatibility
await db.addColumn('users', 'full_name', { type: 'text' });
await db.migrate('users', (row) => {
  if (!row.full_name && row.first_name && row.last_name) {
    return {
      ...row,
      full_name: `${row.first_name} ${row.last_name}`
    };
  }
  return row;
});
```

## 🛠️ CLI Commands

```bash
# Initialize project
npx dapbase init

# Database operations
npx dapbase use mydb          # Switch to database
npx dapbase list              # List all databases/tables
npx dapbase validate          # Validate schema integrity

# Backup operations
npx dapbase backup           # Create backup
npx dapbase list-backups     # Show available backups
npx dapbase restore backup.zip # Restore from backup

# Security
npx dapbase encrypt          # Configure encryption

# Help
npx dapbase help             # Show all commands
```

## 📝 Configuration

Edit `Dapbase/dapbase.config.json`:

```json
{
  "project": "My Awesome App",
  "environment": "development",
  "defaultDatabase": "main",
  "autoBackup": true,
  "backupInterval": "daily",
  "backupPath": "./backups",
  "encryptionEnabled": false,
  "logLevel": "info",
  "maxFileSizeMB": 10
}
```

## 📊 Example: Blog Application

```javascript
// blog.js
const db = require('./Dapbase/dapbase.connection.js');

async function setupBlog() {
  await db.use('blog');
  
  // Users with validation
  await db.createTable('users', {
    username: { type: 'text', unique: true, required: true },
    email: { type: 'text', unique: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
    password_hash: { type: 'text', required: true },
    role: { type: 'text', default: 'user' }
  });
  
  // Posts with relationships
  await db.createTable('posts', {
    title: { type: 'text', required: true },
    slug: { type: 'text', unique: true },
    content: { type: 'text' },
    author_id: { type: 'uuid' },
    status: { type: 'text', default: 'draft' }
  }, {
    author_id: { foreignTable: 'users', foreignKey: 'id' }
  });
  
  // Comments with self-reference
  await db.createTable('comments', {
    content: { type: 'text', required: true },
    post_id: { type: 'uuid' },
    author_id: { type: 'uuid' },
    parent_id: { type: 'uuid' }
  }, {
    post_id: { foreignTable: 'posts', foreignKey: 'id' },
    author_id: { foreignTable: 'users', foreignKey: 'id' },
    parent_id: { foreignTable: 'comments', foreignKey: 'id' }
  });
}

// Query blog posts with authors and comments
async function getPublishedPosts() {
  return await db.select('posts', {
    where: { status: 'published' },
    join: [
      { table: 'users', on: { local: 'author_id', foreign: 'id' }, as: 'author' },
      { table: 'comments', on: { local: 'id', foreign: 'post_id' }, as: 'comments' }
    ],
    orderBy: ['created_at', 'desc'],
    limit: 10
  });
}
```

## 🔧 Advanced Usage

### Custom Validators

```javascript
// Coming soon in v3.1
const columns = {
  password: {
    type: 'text',
    validate: (value) => {
      if (value.length < 8) return 'Password too short';
      if (!/[A-Z]/.test(value)) return 'Need uppercase letter';
      if (!/[0-9]/.test(value)) return 'Need number';
      return true;
    }
  }
};
```

### Transaction Support

```javascript
// Manual transaction pattern
try {
  const user = await db.insert('users', userData);
  await db.insert('profiles', { ...profileData, user_id: user.id });
  await db.insert('settings', { ...settingsData, user_id: user.id });
  console.log('Transaction completed');
} catch (error) {
  console.log('Transaction failed, rolling back');
  // Manual cleanup if needed
}
```

## 📈 Performance Tips

1. **Use indexes** on frequently queried fields
2. **Batch operations** for bulk data (`insertMany`)
3. **Select only needed fields** with `options.fields`
4. **Enable encryption only** for sensitive data
5. **Regular backups** for large databases
6. **Split large tables** by date or category

## 🔍 Debugging

```bash
# Enable debug mode
DEBUG=dapbase* node app.js

# Or inspect files directly
cat Dapbase/main/users.table | jq '.'  # Pretty print with jq
```

## 🤝 Contributing

Dapbase is built slowly, intentionally, and in public. Every commit is a learning moment.

**Ways to contribute:**
- Report bugs or suggest features
- Improve documentation
- Share your use cases
- Submit pull requests
- Create examples or tutorials

## 📄 License

MIT © 2025 Duby

## 🙏 Acknowledgments

Dapbase stands on the shoulders of giants:
- **SQLite** for inspiration in simplicity
- **Lowdb** for the file-based approach
- **Prisma** for schema validation ideas
- Every developer who believes data should be visible

---

## 🗺️ Roadmap

### v3.0 (Current) ✅
- [x] Schema validation with constraints
- [x] Foreign key relationships
- [x] Field-level encryption
- [x] Backup and restore system
- [x] Full-featured CLI
- [x] Advanced query operators
- [x] Indexes for performance
- [x] Data migrations

### v3.1 (Planned)
- [ ] Custom validator functions
- [ ] Compound indexes
- [ ] Full-text search
- [ ] Change streams/events
- [ ] Browser compatibility
- [ ] Plugin system
- [ ] More join types (right, full)

### v3.2 (Future)
- [ ] Web UI for database browsing
- [ ] Replication between instances
- [ ] SQL-like query language
- [ ] GraphQL auto-generation
- [ ] Built-in REST API server

---

**Dapbase — Because your data should be yours.**  
Simple. Visible. Powerful. Yours.

## 🆘 Getting Help

- **Issues**: [GitHub Issues]("https://github.com/Dubemernest23/dapbase/issues")
- **Discussions**: [GitHub Discussions](https://github.com/Dubemernest23/dapbase/discussions)
- **Twitter**: [@duby](https://x.com/dubemernest)

## 🚨 Migration from v2

```javascript
// Old v2 code (still works)
await db.createTable('users', { name: 'text' });

// New v3 code (recommended)
await db.createTable('users', { 
  name: { type: 'text', required: true } 
});
```

All v2 APIs are backward compatible. New features are opt-in.

---

*"If you can't `ls` your database and understand it, it's not simple enough."*