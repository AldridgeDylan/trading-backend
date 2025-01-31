import { Order } from "../models/order";
import logger from "../config/logger";

export class OrderBook {
    private buys: Map<string, Order[]> = new Map();
    private sells: Map<string, Order[]> = new Map();
  
    addOrder(order: Order): void {
        const side = order.type === 'BUY' ? this.buys : this.sells;
    
        if (!side.has(order.symbol)) {
          side.set(order.symbol, []);
        }
    
        const orders = side.get(order.symbol)!;
        orders.push(order);
    
        if (order.type === 'BUY') {
          orders.sort((a, b) => b.price - a.price || a.createdAt.getTime() - b.createdAt.getTime());
        } else {
          orders.sort((a, b) => a.price - b.price || a.createdAt.getTime() - b.createdAt.getTime());
        }
    
        logger.info(`Order added to ${order.type} book: ${JSON.stringify(order)}`);
      }

    removeOrder(orderId: number): boolean {
        for (const [symbol, orders] of this.buys) {
          const index = orders.findIndex(order => order.id === orderId);
          if (index !== -1) {
            orders.splice(index, 1);
            logger.info(`Order ${orderId} removed from BUY book.`);
            return true;
          }
        }
    
        for (const [symbol, orders] of this.sells) {
          const index = orders.findIndex(order => order.id === orderId);
          if (index !== -1) {
            orders.splice(index, 1);
            logger.info(`Order ${orderId} removed from SELL book.`);
            return true;
          }
        }
    
        logger.warn(`Order ${orderId} not found in order book.`);
        return false;
      }
  
    getBestBuy(symbol: string): Order | null {
      return this.buys.get(symbol)?.[0] || null;
    }
  
    getBestSell(symbol: string): Order | null {
      return this.sells.get(symbol)?.[0] || null;
    }

    getBuyOrders(symbol: string): Order[] {
        return this.buys.get(symbol) || [];
    }

    getSellOrders(symbol: string): Order[] {
        return this.sells.get(symbol) || [];
    }

}