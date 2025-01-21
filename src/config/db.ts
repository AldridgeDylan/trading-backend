import sqlite3 from 'sqlite3';
import path from 'path';

const sqlite = sqlite3.verbose();
const dbPath = path.join(__dirname, '../../db.sqlite3');

const db = new sqlite.Database(dbPath);

function init(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create 'users' table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          balance REAL DEFAULT 100000,
          createdAt TEXT
        )
      `);

      // Create 'portfolios' table
      db.run(`
        CREATE TABLE IF NOT EXISTS portfolios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT,
          symbol TEXT,
          quantity REAL,
          avgPrice REAL,
          createdAt TEXT
        )
      `);

      // Create 'orders' table
      db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT,
          symbol TEXT,
          type TEXT,
          quantity REAL,
          limitPrice REAL,
          filledPrice REAL,
          status TEXT,
          createdAt TEXT
        )
      `, (err) => {
        if (err) return reject(err);
        console.log('SQLite tables ensured.');
        resolve();
      });
    });
  });
}

export default { db, init };
