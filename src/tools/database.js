const { tool } = require('ai');
const { z } = require('zod');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const Logger = require('../utils/logger');

// Initialize database
const dbPath = path.join(__dirname, '../../database.db');
const db = new Database(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON');

const databaseTool = tool({
  description: 'Execute SQL queries on the SQLite database. You can create tables, insert data, query, update, delete - any SQL operation.',
  inputSchema: z.object({
    query: z.string().describe('The SQL query to execute'),
    params: z.array(z.any()).optional().describe('Optional parameters for prepared statements (prevents SQL injection)'),
    mode: z.enum(['query', 'exec']).default('query').describe('Mode: "query" for SELECT/returning data, "exec" for DDL/multiple statements'),
  }),
  execute: async ({ query, params = [], mode }) => {
    // Enhanced logging with timestamps and area tags
    Logger.database(`Executing ${mode.toUpperCase()} query`, {
      query: query.length > 100 ? query.substring(0, 100) + '...' : query,
      paramsCount: params.length,
      hasParams: params.length > 0
    });

    if (params.length > 0) {
      Logger.debug('database', 'Query parameters', params);
    }

    const startTime = Date.now();

    try {
      let result;

      // IMPORTANT: exec mode should ONLY be used for DDL or when there are NO parameters
      // If parameters are provided, we must use prepare() instead
      if (mode === 'exec' && params.length === 0) {
        Logger.debug('database', 'Using exec mode (DDL/multiple statements)');
        // Execute mode for DDL, multiple statements, or non-returning queries WITHOUT parameters
        result = db.exec(query);
        const duration = Date.now() - startTime;
        Logger.success('database', `Exec completed in ${duration}ms`);
        return {
          success: true,
          message: 'Query executed successfully',
          result: result,
          duration: duration
        };
      } else {
        Logger.debug('database', 'Using prepared statement mode');
        // Query mode for ALL parameterized queries and SELECT operations
        const stmt = db.prepare(query);

        // Determine if this is a SELECT or data-returning query
        const isSelect = query.trim().toUpperCase().startsWith('SELECT') ||
                        query.trim().toUpperCase().includes('RETURNING') ||
                        query.trim().toUpperCase().startsWith('PRAGMA');

        if (isSelect) {
          // Return all rows for SELECT queries
          const rows = params.length > 0 ? stmt.all(...params) : stmt.all();
          const duration = Date.now() - startTime;
          Logger.success('database', `SELECT returned ${rows.length} rows in ${duration}ms`);
          return {
            success: true,
            rows: rows,
            count: rows.length,
            duration: duration
          };
        } else {
          // For INSERT, UPDATE, DELETE - run and return info
          const info = params.length > 0 ? stmt.run(...params) : stmt.run();
          const duration = Date.now() - startTime;
          Logger.success('database', `${query.trim().split(' ')[0].toUpperCase()} affected ${info.changes} rows in ${duration}ms`, {
            changes: info.changes,
            lastInsertRowid: info.lastInsertRowid
          });
          return {
            success: true,
            changes: info.changes,
            lastInsertRowid: info.lastInsertRowid,
            duration: duration
          };
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      Logger.error('database', `Query failed after ${duration}ms`, error);
      return {
        success: false,
        error: error.message,
        duration: duration
      };
    }
  },
});

module.exports = databaseTool;