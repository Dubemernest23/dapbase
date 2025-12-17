// dapbase.connection.js - Dapbase v3.0 with Schema Validation
// Auto-generated — do not edit manually

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const DAPBASE_ROOT = __dirname;
let currentDb = null;
let currentDbPath = null;

// Schema validation types and constraints
const validators = {
  types: {
    text: (value) => typeof value === 'string',
    string: (value) => typeof value === 'string',
    int: (value) => Number.isInteger(Number(value)),
    integer: (value) => Number.isInteger(Number(value)),
    float: (value) => !isNaN(Number(value)),
    number: (value) => !isNaN(Number(value)),
    boolean: (value) => typeof value === 'boolean' || ['true', 'false', '1', '0'].includes(String(value)),
    uuid: (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
    timestamp: (value) => !isNaN(Date.parse(value)),
    date: (value) => !isNaN(Date.parse(value)),
    json: (value) => {
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }
  },

  constraints: {
    required: (value, isRequired) => !isRequired || (value !== undefined && value !== null),
    unique: (value, values, isUnique) => !isUnique || !values.includes(value),
    min: (value, min) => value >= min,
    max: (value, max) => value <= max,
    minLength: (value, min) => String(value).length >= min,
    maxLength: (value, max) => String(value).length <= max,
    pattern: (value, pattern) => new RegExp(pattern).test(String(value)),
    default: (value, defaultValue) => value !== undefined ? value : defaultValue
  }
};

class SchemaValidator {
  static validateRow(row, schema, existingRows = []) {
    const errors = [];
    const validatedRow = { ...row };

    // Check each column in schema
    for (const [column, definition] of Object.entries(schema)) {
      const value = row[column];
      const isNew = !existingRows.some(r => r.id === row.id);
      const existingValues = existingRows.map(r => r[column]);

      // Type validation
      if (definition.type && value !== undefined && value !== null) {
        const typeValidator = validators.types[definition.type];
        if (typeValidator && !typeValidator(value)) {
          errors.push(`Column "${column}": Expected type "${definition.type}", got "${typeof value}"`);
        }
      }

      // Required constraint
      if (definition.required && (value === undefined || value === null)) {
        errors.push(`Column "${column}" is required`);
      }

      // Unique constraint
      if (definition.unique && value !== undefined && value !== null) {
        if (existingValues.includes(value) && isNew) {
          errors.push(`Column "${column}" must be unique. Value "${value}" already exists`);
        }
      }

      // Min/Max for numbers
      if (definition.min !== undefined && value !== undefined && value !== null) {
        if (value < definition.min) {
          errors.push(`Column "${column}": Value ${value} is less than minimum ${definition.min}`);
        }
      }
      if (definition.max !== undefined && value !== undefined && value !== null) {
        if (value > definition.max) {
          errors.push(`Column "${column}": Value ${value} exceeds maximum ${definition.max}`);
        }
      }

      // Min/Max length for strings
      if (definition.minLength !== undefined && value !== undefined && value !== null) {
        if (String(value).length < definition.minLength) {
          errors.push(`Column "${column}": Length ${String(value).length} is less than minimum ${definition.minLength}`);
        }
      }
      if (definition.maxLength !== undefined && value !== undefined && value !== null) {
        if (String(value).length > definition.maxLength) {
          errors.push(`Column "${column}": Length ${String(value).length} exceeds maximum ${definition.maxLength}`);
        }
      }

      // Pattern validation
      if (definition.pattern && value !== undefined && value !== null) {
        if (!new RegExp(definition.pattern).test(String(value))) {
          errors.push(`Column "${column}": Value "${value}" doesn't match pattern "${definition.pattern}"`);
        }
      }

      // Apply default value if needed
      if (value === undefined && definition.default !== undefined) {
        validatedRow[column] = typeof definition.default === 'function' 
          ? definition.default() 
          : definition.default;
      }
    }

    // Check for extra fields not in schema
    for (const field of Object.keys(row)) {
      if (!schema[field] && field !== 'id') {
        errors.push(`Field "${field}" is not defined in schema`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Schema validation failed:\n${errors.join('\n')}`);
    }

    return validatedRow;
  }
}

const db = {
  // Use or create a database folder
  async use(databaseName) {
    if (!databaseName || typeof databaseName !== 'string') {
      throw new Error('Database name must be a non-empty string');
    }

    currentDb = databaseName.trim();
    currentDbPath = path.join(DAPBASE_ROOT, currentDb);

    if (!fs.existsSync(currentDbPath)) {
      fs.mkdirSync(currentDbPath, { recursive: true });
      console.log(`Created new database folder: ${currentDb}`);
    } else {
      console.log(`Using database: ${currentDb}`);
    }

    return db;
  },

  // Create table with enhanced schema definition
  async createTable(tableName, columns, relationships = {}, options = {}) {
    if (!currentDbPath) throw new Error('Call db.use("name") first');
    if (!tableName || typeof tableName !== 'string') throw new Error('Table name required');
    if (!columns || typeof columns !== 'object') throw new Error('Columns definition required');

    const tablePath = path.join(currentDbPath, `${tableName}.table`);
    if (fs.existsSync(tablePath)) {
      throw new Error(`Table "${tableName}" already exists`);
    }

    // Enhanced schema format: { column: { type: 'text', unique: true, required: true } }
    const normalizedColumns = {};
    for (const [colName, colDef] of Object.entries(columns)) {
      if (typeof colDef === 'string') {
        // Simple format: 'text' -> { type: 'text' }
        normalizedColumns[colName] = { type: colDef };
      } else if (typeof colDef === 'object') {
        normalizedColumns[colName] = colDef;
      } else {
        throw new Error(`Invalid column definition for "${colName}"`);
      }
    }

    // Auto-add id field if not present
    if (!normalizedColumns.id) {
      normalizedColumns.id = { type: 'uuid', required: true };
    }

    const tableData = {
      name: tableName,
      createdAt: new Date().toISOString(),
      columns: normalizedColumns,
      relationships,
      rows: [],
      indexes: {},
      options: {
        encryption: options.encryption || {},
        timestamps: options.timestamps !== false
      }
    };

    fs.writeFileSync(tablePath, JSON.stringify(tableData, null, 2), 'utf-8');
    console.log(`Table "${tableName}" created with schema validation support`);
    return db;
  },

  // Insert with schema validation and foreign key checking
  async insert(tableName, rowData, options = {}) {
    if (!currentDbPath) throw new Error('No database selected');

    const tablePath = path.join(currentDbPath, `${tableName}.table`);
    if (!fs.existsSync(tablePath)) throw new Error(`Table "${tableName}" not found`);

    const table = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));

    // Apply schema validation
    const validatedRow = SchemaValidator.validateRow(rowData, table.columns, table.rows);

    // Auto-generate UUID for id field
    if (table.columns.id && table.columns.id.type === 'uuid' && !validatedRow.id) {
      validatedRow.id = uuidv4();
    }

    // Add timestamps if enabled
    if (table.options.timestamps) {
      const now = new Date().toISOString();
      if (!validatedRow.createdAt) validatedRow.createdAt = now;
      if (!validatedRow.updatedAt) validatedRow.updatedAt = now;
    }

    // Validate foreign keys
    for (const field in table.relationships) {
      if (validatedRow[field] !== undefined) {
        const { foreignTable, foreignKey } = table.relationships[field];
        const foreignPath = path.join(currentDbPath, `${foreignTable}.table`);
        
        if (!fs.existsSync(foreignPath)) {
          throw new Error(`Foreign table "${foreignTable}" does not exist`);
        }
        
        const foreignTableData = JSON.parse(fs.readFileSync(foreignPath, 'utf-8'));
        const exists = foreignTableData.rows.some(row => row[foreignKey] === validatedRow[field]);
        
        if (!exists) {
          throw new Error(`Foreign key violation: ${field}=${validatedRow[field]} not found in ${foreignTable}`);
        }
      }
    }

    // Encrypt fields if configured
    if (table.options.encryption && table.options.encryption.fields) {
      for (const field of table.options.encryption.fields) {
        if (validatedRow[field] !== undefined) {
          validatedRow[field] = this._encryptField(validatedRow[field], table.options.encryption.key);
        }
      }
    }

    table.rows.push(validatedRow);
    fs.writeFileSync(tablePath, JSON.stringify(table, null, 2));
    
    if (options.silent !== true) {
      console.log(`Inserted into "${tableName}":`, validatedRow);
    }
    
    return validatedRow;
  },

  // Bulk insert
  async insertMany(tableName, rowsData, options = {}) {
    const results = [];
    for (const rowData of rowsData) {
      const result = await this.insert(tableName, rowData, { ...options, silent: true });
      results.push(result);
    }
    
    if (options.silent !== true) {
      console.log(`Inserted ${results.length} rows into "${tableName}"`);
    }
    
    return results;
  },

  // Select with advanced querying
  async select(tableName, options = {}) {
    if (!currentDbPath) throw new Error('No database selected');

    const tablePath = path.join(currentDbPath, `${tableName}.table`);
    if (!fs.existsSync(tablePath)) throw new Error(`Table "${tableName}" not found`);

    const table = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));
    let rows = [...table.rows];

    // Decrypt fields if needed
    if (table.options.encryption && table.options.encryption.fields) {
      rows = rows.map(row => {
        const decrypted = { ...row };
        for (const field of table.options.encryption.fields) {
          if (decrypted[field] && typeof decrypted[field] === 'object' && decrypted[field].encrypted) {
            decrypted[field] = this._decryptField(decrypted[field], table.options.encryption.key);
          }
        }
        return decrypted;
      });
    }

    // WHERE filter with operators
    if (options.where) {
      rows = rows.filter(row => {
        return Object.entries(options.where).every(([key, condition]) => {
          if (condition === undefined || condition === null) {
            return row[key] === condition;
          }
          
          // Handle operator syntax: { age: { $gt: 18 } }
          if (typeof condition === 'object' && !Array.isArray(condition)) {
            return Object.entries(condition).every(([operator, value]) => {
              switch (operator) {
                case '$eq': return row[key] === value;
                case '$ne': return row[key] !== value;
                case '$gt': return row[key] > value;
                case '$gte': return row[key] >= value;
                case '$lt': return row[key] < value;
                case '$lte': return row[key] <= value;
                case '$in': return Array.isArray(value) && value.includes(row[key]);
                case '$nin': return Array.isArray(value) && !value.includes(row[key]);
                case '$like': return String(row[key]).includes(String(value));
                case '$regex': return new RegExp(value).test(String(row[key]));
                default: return row[key] === condition;
              }
            });
          }
          
          // Handle array values
          if (Array.isArray(condition)) {
            return condition.includes(row[key]);
          }
          
          // Simple equality
          return row[key] === condition;
        });
      });
    }

    // JOIN support
    if (options.join && Array.isArray(options.join)) {
      for (const join of options.join) {
        const { table: joinTable, on, as = joinTable, type = 'left' } = join;
        const joinPath = path.join(currentDbPath, `${joinTable}.table`);
        
        if (!fs.existsSync(joinPath)) {
          if (type === 'inner') {
            rows = []; // Inner join with missing table = no results
            break;
          }
          continue;
        }

        const joinData = JSON.parse(fs.readFileSync(joinPath, 'utf-8'));
        const joinRows = joinData.rows;

        rows = rows.map(row => {
          const related = joinRows.filter(jrow => jrow[on.foreign] === row[on.local]);
          
          if (type === 'inner' && related.length === 0) {
            return null; // Filter out in next step
          }
          
          return { 
            ...row, 
            [as]: related.length > 0 ? (related.length === 1 ? related[0] : related) : null 
          };
        }).filter(row => row !== null); // Remove nulls from inner joins
      }
    }

    // Sorting
    if (options.orderBy) {
      const [field, direction = 'asc'] = Array.isArray(options.orderBy) 
        ? options.orderBy 
        : [options.orderBy, 'asc'];
      
      rows.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        
        if (aVal === bVal) return 0;
        if (aVal === undefined || aVal === null) return direction === 'asc' ? -1 : 1;
        if (bVal === undefined || bVal === null) return direction === 'asc' ? 1 : -1;
        
        const comparison = aVal < bVal ? -1 : 1;
        return direction === 'asc' ? comparison : -comparison;
      });
    }

    // Pagination
    if (options.limit || options.offset) {
      const offset = options.offset || 0;
      const limit = options.limit || rows.length;
      rows = rows.slice(offset, offset + limit);
    }

    // Field selection
    if (options.fields && Array.isArray(options.fields)) {
      rows = rows.map(row => {
        const selected = {};
        options.fields.forEach(field => {
          if (row[field] !== undefined) {
            selected[field] = row[field];
          }
        });
        return selected;
      });
    }

    if (options.silent !== true) {
      console.log(`\n${rows.length} row(s) from "${tableName}":`);
      if (rows.length > 0) {
        console.table(rows);
      }
    }
    
    return rows;
  },

  // Update with validation
  async update(tableName, updates, where, options = {}) {
    if (!currentDbPath) throw new Error('No database selected');
    const tablePath = path.join(currentDbPath, `${tableName}.table`);
    if (!fs.existsSync(tablePath)) throw new Error(`Table "${tableName}" not found`);

    const table = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));
    let updatedCount = 0;
    const updatedRows = [];

    table.rows = table.rows.map(row => {
      const matches = Object.keys(where).every(k => row[k] === where[k]);
      
      if (matches) {
        // Create updated row with validation
        const updatedRow = { ...row, ...updates };
        
        // Re-validate the entire row
        try {
          const validatedRow = SchemaValidator.validateRow(updatedRow, table.columns, table.rows.filter(r => r.id !== row.id));
          
          // Update timestamps
          if (table.options.timestamps) {
            validatedRow.updatedAt = new Date().toISOString();
          }
          
          // Re-encrypt fields if needed
          if (table.options.encryption && table.options.encryption.fields) {
            for (const field of table.options.encryption.fields) {
              if (validatedRow[field] !== undefined && !(validatedRow[field] && validatedRow[field].encrypted)) {
                validatedRow[field] = this._encryptField(validatedRow[field], table.options.encryption.key);
              }
            }
          }
          
          updatedCount++;
          updatedRows.push(validatedRow);
          return validatedRow;
        } catch (error) {
          // If validation fails, keep original row
          console.warn(`Update validation failed for row ${row.id}:`, error.message);
          return row;
        }
      }
      
      return row;
    });

    if (updatedCount > 0) {
      fs.writeFileSync(tablePath, JSON.stringify(table, null, 2));
    }
    
    if (options.silent !== true) {
      console.log(`Updated ${updatedCount} row(s) in "${tableName}"`);
    }
    
    return { count: updatedCount, rows: updatedRows };
  },

  // Delete with cascading options
  async delete(tableName, where, options = {}) {
    if (!currentDbPath) throw new Error('No database selected');
    const tablePath = path.join(currentDbPath, `${tableName}.table`);
    if (!fs.existsSync(tablePath)) throw new Error(`Table "${tableName}" not found`);

    const table = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));
    const beforeCount = table.rows.length;

    const rowsToDelete = table.rows.filter(row =>
      Object.keys(where).every(k => row[k] === where[k])
    );

    // Check for cascade deletion
    if (options.cascade) {
      // Find tables that have relationships to this table
      const allTables = fs.readdirSync(currentDbPath)
        .filter(f => f.endsWith('.table') && f !== `${tableName}.table`);
      
      for (const tableFile of allTables) {
        const otherTablePath = path.join(currentDbPath, tableFile);
        const otherTable = JSON.parse(fs.readFileSync(otherTablePath, 'utf-8'));
        
        for (const [field, rel] of Object.entries(otherTable.relationships || {})) {
          if (rel.foreignTable === tableName) {
            // Delete rows in other table that reference deleted rows
            const idsToDelete = rowsToDelete.map(r => r.id);
            otherTable.rows = otherTable.rows.filter(row => 
              !idsToDelete.includes(row[field])
            );
            fs.writeFileSync(otherTablePath, JSON.stringify(otherTable, null, 2));
          }
        }
      }
    }

    table.rows = table.rows.filter(row =>
      !Object.keys(where).every(k => row[k] === where[k])
    );

    fs.writeFileSync(tablePath, JSON.stringify(table, null, 2));
    
    const deletedCount = beforeCount - table.rows.length;
    if (options.silent !== true) {
      console.log(`Deleted ${deletedCount} row(s) from "${tableName}"`);
    }
    
    return { count: deletedCount, rows: rowsToDelete };
  },

  // Add index for performance
  async addIndex(tableName, field, options = {}) {
    const tablePath = path.join(currentDbPath, `${tableName}.table`);
    const table = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));
    
    table.indexes[field] = {
      type: options.type || 'value',
      unique: options.unique || false,
      createdAt: new Date().toISOString()
    };
    
    // Build index
    if (options.type === 'hash') {
      const index = {};
      table.rows.forEach((row, idx) => {
        const key = row[field];
        if (key !== undefined) {
          if (!index[key]) index[key] = [];
          index[key].push(idx);
        }
      });
      table.indexes[field].data = index;
    }
    
    fs.writeFileSync(tablePath, JSON.stringify(table, null, 2));
    console.log(`Index added on "${field}" in "${tableName}"`);
    return db;
  },

  // Schema operations
  async addColumn(tableName, columnName, definition) {
    const tablePath = path.join(currentDbPath, `${tableName}.table`);
    const table = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));
    
    if (table.columns[columnName]) {
      throw new Error(`Column "${columnName}" already exists`);
    }
    
    table.columns[columnName] = typeof definition === 'string' 
      ? { type: definition }
      : definition;
    
    // Add default value to existing rows
    const defaultValue = definition.default !== undefined 
      ? (typeof definition.default === 'function' ? definition.default() : definition.default)
      : null;
    
    table.rows = table.rows.map(row => ({
      ...row,
      [columnName]: defaultValue
    }));
    
    fs.writeFileSync(tablePath, JSON.stringify(table, null, 2));
    console.log(`Added column "${columnName}" to "${tableName}"`);
    return db;
  },

  async removeColumn(tableName, columnName) {
    const tablePath = path.join(currentDbPath, `${tableName}.table`);
    const table = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));
    
    if (!table.columns[columnName]) {
      throw new Error(`Column "${columnName}" does not exist`);
    }
    
    delete table.columns[columnName];
    
    // Remove column from rows
    table.rows = table.rows.map(row => {
      const newRow = { ...row };
      delete newRow[columnName];
      return newRow;
    });
    
    fs.writeFileSync(tablePath, JSON.stringify(table, null, 2));
    console.log(`Removed column "${columnName}" from "${tableName}"`);
    return db;
  },

  // Backup current database
  async backup(backupPath = null) {
    if (!currentDbPath) throw new Error('No database selected');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = backupPath || path.join(DAPBASE_ROOT, '..', 'backups', `backup-${currentDb}-${timestamp}.zip`);
    
    const output = fs.createWriteStream(backupFile);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        console.log(`Database "${currentDb}" backed up to: ${backupFile}`);
        resolve(backupFile);
      });
      
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(currentDbPath, currentDb);
      archive.finalize();
    });
  },

  // Utility methods
  _encryptField(value, key) {
    if (!key) return value;
    
    try {
      const cipher = crypto.createCipher('aes-256-cbc', key);
      let encrypted = cipher.update(JSON.stringify(value), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return { encrypted: true, data: encrypted };
    } catch {
      return value;
    }
  },

  _decryptField(encryptedObj, key) {
    if (!encryptedObj.encrypted || !key) return encryptedObj;
    
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', key);
      let decrypted = decipher.update(encryptedObj.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted);
    } catch {
      return encryptedObj;
    }
  },

  // Migration helper
  async migrate(tableName, migrationFn) {
    const tablePath = path.join(currentDbPath, `${tableName}.table`);
    if (!fs.existsSync(tablePath)) throw new Error(`Table "${tableName}" not found`);
    
    const table = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));
    
    // Apply migration to all rows
    table.rows = table.rows.map((row, index) => {
      try {
        return migrationFn(row, index, table.rows);
      } catch (error) {
        console.warn(`Migration failed for row ${row.id}:`, error.message);
        return row;
      }
    });
    
    fs.writeFileSync(tablePath, JSON.stringify(table, null, 2));
    console.log(`Migration applied to ${table.rows.length} rows in "${tableName}"`);
    return db;
  }
};

module.exports = db;