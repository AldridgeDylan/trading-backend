// Orders, unlike portfolios, should be persistant and not be deleted when the user cookie expires

import dbObj from '../config/db';
import logger from '../config/logger';

const db = dbObj.db;

export async function getPendingOrders(userId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM orders WHERE userId = ? AND status = 'PENDING'`,
        [userId],
        (err, rows) => {
          if (err) {
            logger.error(`Error fetching pending orders for userId=${userId}: ${err.message}`);
            return reject(err);
          }
          resolve(rows || []);
        }
      );
    });
}

export async function cancelOrder(userId: string, orderId: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        db.run(
            `UPDATE orders SET status = 'CANCELED' WHERE userId = ? AND id = ? AND status = 'PENDING'`,
            [userId, orderId],
            function (err) {
                if (err) {
                    logger.error(`Error canceling order: userId=${userId}, orderId=${orderId} - ${err.message}`);
                    return reject(err);
                }
  
                if (this.changes === 0) {
                    logger.warn(`No pending order found to cancel: userId=${userId}, orderId=${orderId}`);
                    return reject(new Error(`No pending order found for userId=${userId} with orderId=${orderId}`));
                }
  
                logger.info(`Order successfully canceled: userId=${userId}, orderId=${orderId}`);
                resolve();
            }
        );
    });
}

// Will need to add the entry to the database and in-memory order book
// For the purposes of this project, a simulator should create an opposite position so that the order can be filled
// The matching engine will then fill orders and update the orders table
export async function createOrder(
    userId: string, 
    symbol: string, 
    quantity: number, 
    price: number, 
    direction: 'BUY'|'SELL', 
    type: 'MARKET'|'LIMIT'): Promise<void> {
        /** ---------------------------------------------------------- */

        // Order will start as pending until matched

        return;
        /** ---------------------------------------------------------- */
}

// May require update orders function for matching engine