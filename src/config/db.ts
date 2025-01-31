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
          balance REAL NOT NULL DEFAULT 100000,
          createdAt TEXT NOT NULL
        );
      `);

      // Create 'portfolios' table
      db.run(`
        CREATE TABLE IF NOT EXISTS portfolio (
          userId TEXT NOT NULL,
          symbol TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          avgPrice REAL NOT NULL,
          PRIMARY KEY (userId, symbol),
          FOREIGN KEY (userId) REFERENCES users(id)
        );
      `);

      // Create 'orders' table
      db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          symbol TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
          quantity INTEGER NOT NULL,
          price REAL NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('PENDING', 'PARTIALLY_FILLED', 'FILLED', 'CANCELED')),
          createdAt TEXT NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id)
        );
      `, (err) => {
        if (err) return reject(err);
        console.log('SQLite tables ensured.');
        resolve();
      });
    });
  });
}

export default { db, init };
