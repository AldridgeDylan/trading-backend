import dbObj from '../config/db';
import logger from '../config/logger';

const db = dbObj.db;

export function createUser(userId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO users (id, balance, createdAt) VALUES (?, ?, ?)`,
      [userId, 100000, now],
      function (err) {
        if (err) {
          logger.error(`Error creating user: ${userId} - ${err.message}`);
          if ((err as any).code === 'SQLITE_CONSTRAINT') {
            return reject(new Error(`User with id=${userId} already exists`));
          }
          return reject(err);
        }
        logger.info(`Created user with id=${userId}`);
        resolve();
      }
    );
  });
}

export async function getUser(userId: string) {
  return new Promise<any | undefined>((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) return reject(err);
      resolve(row || undefined);
    });
  });
}

export async function updateUserBalance(userId: string, newBalance: number) {
  return new Promise<void>((resolve, reject) => {
    db.run(
      'UPDATE users SET balance = ? WHERE id = ?',
      [newBalance, userId],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}
