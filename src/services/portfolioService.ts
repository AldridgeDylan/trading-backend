import dbObj from '../config/db';
import logger from '../config/logger';

interface PortfolioQuantityRow {
    quantity: number;
}

const db = dbObj.db;

export function getPortfolio(userId: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM portfolio WHERE userId = ?`,
      [userId],
      (err, rows) => {
        if (err) {
          logger.error(`Error fetching portfolio for user: ${userId} - ${err.message}`);
          return reject(err);
        }
        resolve(rows || []);
      }
    );
  });
}

export function upsertPortfolioEntry(
  userId: string,
  symbol: string,
  quantity: number,
  price: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `
      INSERT INTO portfolio (userId, symbol, quantity, price)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(userId, symbol) DO UPDATE SET
        quantity = quantity + excluded.quantity,
        price = (
          CASE
            WHEN portfolio.quantity + excluded.quantity > 0 THEN
              ((portfolio.quantity * portfolio.price) + (excluded.quantity * excluded.price)) 
              / (portfolio.quantity + excluded.quantity)
            ELSE portfolio.price
          END
        )
      `,
      [userId, symbol, quantity, price],
      function (err) {
        if (err) {
            logger.error(`Error upserting portfolio entry: userId=${userId}, symbol=${symbol} - ${err.message}`);
          return reject(err);
        }
        logger.info(`Portfolio entry upserted: userId=${userId}, symbol=${symbol}, quantity=${quantity}, price=${price}`);
        resolve();
      }
    );
  });
}

export function deletePortfolioEntry(userId: string, symbol: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM portfolio WHERE userId = ? AND symbol = ?`,
      [userId, symbol],
      function (err) {
        if (err) {
          logger.error(`Error deleting portfolio entry: userId=${userId}, symbol=${symbol} - ${err.message}`);
          return reject(err);
        }
        logger.info(`Portfolio entry deleted: userId=${userId}, symbol=${symbol}`);
        resolve();
      }
    );
  });
}

export function reducePortfolioEntry(
    userId: string,
    symbol: string,
    quantity: number
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        db.run(
          `
          UPDATE portfolio
          SET quantity = quantity - ?
          WHERE userId = ? AND symbol = ?
        `,
          [quantity, userId, symbol],
          function (err) {
            if (err) {
              return reject(err);
            }
  
            db.get<PortfolioQuantityRow>(
              `
              SELECT quantity FROM portfolio
              WHERE userId = ? AND symbol = ?
            `,
              [userId, symbol],
              (err, row) => {
                if (err) {
                  return reject(err);
                }
  
                if (row && row.quantity <= 0) {
                  // If the quantity is 0 or less, delete the entry
                  deletePortfolioEntry(userId, symbol)
                    .then(() => {
                      resolve();
                    })
                    .catch((err) => {
                      reject(err);
                    });
                } else {
                  // If quantity is greater than 0, no need to delete
                  resolve();
                }
              }
            );
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }
  
