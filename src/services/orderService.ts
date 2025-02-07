import dbObj from '../config/db';
import logger from '../config/logger';
import { MatchingEngine } from '../matching/matchingEngine';
import { Order } from '../models/order';

const db = dbObj.db;
const matchingEngine = new MatchingEngine(); 

export async function getPendingOrders(userId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM orders WHERE userId = ? AND status = 'PENDING' OR status = 'PARTIALLY_FILLED'`,
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
  
          matchingEngine.getOrderBook().removeOrder(orderId);
          logger.info(`Order successfully canceled: userId=${userId}, orderId=${orderId}`);
          resolve();
        }
      );
    });
  }

export async function createOrder(
    userId: string, 
    symbol: string, 
    quantity: number, 
    price: number, 
    type: 'BUY'|'SELL'): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const now = new Date().toISOString();

            db.run(
                `INSERT INTO orders (userId, symbol, type, quantity, price, status, createdAt) 
                VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
                [userId, symbol, type, quantity, price, now],
                function (err) {
                    if (err) {
                        logger.error(`Error creating order: ${err.message}`);
                        return reject(err);
                    }
                    const orderId = this.lastID;
                    const newOrder: Order = {
                        id: orderId,
                        userId,
                        symbol,
                        type: type,
                        quantity,
                        price: price,
                        status: 'PENDING',
                        createdAt: new Date(now)
                    };
   
                    matchingEngine.getOrderBook().addOrder(newOrder);
                    logger.info(`Order added to order book: ${JSON.stringify(newOrder)}`);

                    matchingEngine.matchOrder(newOrder);

                    resolve();
                }
            )
        }
    );
}

export async function updateOrderStatus(
    orderId: number,
    newStatus: 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELED'
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      db.run(
        `UPDATE orders SET status = ? WHERE id = ?`,
        [newStatus, orderId],
        function (err) {
          if (err) {
            logger.error(`Error updating order status: orderId=${orderId}, status=${newStatus} - ${err.message}`);
            return reject(err);
          }
          logger.info(`Order status updated: orderId=${orderId}, status=${newStatus}`);
          resolve();
        }
      );
    });
}
  