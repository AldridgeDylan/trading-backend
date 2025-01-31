import { Order } from '../models/order';
import { OrderBook } from './orderBook';
import logger from '../config/logger';
import { updateOrderStatus } from '../services/orderService';
import { upsertPortfolioEntry } from '../services/portfolioService';
import { updateUserBalance, getUser } from '../services/userService';

export class MatchingEngine {
  private orderBook = new OrderBook();

  constructor() {}

  matchOrder(order: Order): void {
    if (order.type === 'BUY') {
      this.matchBuyOrder(order);
    } else {
      this.matchSellOrder(order);
    }
  }

  private matchSellOrder(order: Order): void {
    let remainingQuantity = order.quantity;
    const buyOrders = this.orderBook.getBuyOrders(order.symbol);

    while (buyOrders.length > 0 && remainingQuantity > 0) {
        const bestBuy = buyOrders[0];

        if (order.price > bestBuy.price) {
            break;
        }

        const tradeQuantity = Math.min(remainingQuantity, bestBuy.quantity);
        const executionPrice = bestBuy.price

        this.executeTrade(bestBuy, order, tradeQuantity, executionPrice);

        remainingQuantity -= tradeQuantity;
        bestBuy.quantity -= tradeQuantity;

        if (bestBuy.quantity === 0) {
            this.orderBook.removeOrder(bestBuy.id);
        }
    }

    if (remainingQuantity > 0) {
        order.quantity = remainingQuantity;
        this.orderBook.addOrder(order);
        logger.info(`Partially filled SELL order added back to order book: ${JSON.stringify(order)}`);
    }
}

private matchBuyOrder(order: Order): void {
    let remainingQuantity = order.quantity;
    const sellOrders = this.orderBook.getSellOrders(order.symbol);

    while (sellOrders.length > 0 && remainingQuantity > 0) {
        const bestSell = sellOrders[0];

        if (order.price < bestSell.price) {
            break;
        }

        const tradeQuantity = Math.min(remainingQuantity, bestSell.quantity);
        const executionPrice = bestSell.price;

        this.executeTrade(order, bestSell, tradeQuantity, executionPrice);

        remainingQuantity -= tradeQuantity;
        bestSell.quantity -= tradeQuantity;

        if (bestSell.quantity === 0) {
            this.orderBook.removeOrder(bestSell.id);
        }
    }

    if (remainingQuantity > 0) {
        order.quantity = remainingQuantity;
        this.orderBook.addOrder(order);
        logger.info(`Partially filled BUY order added back to order book: ${JSON.stringify(order)}`);
    }
}


  private async executeTrade(buyOrder: Order, sellOrder: Order, quantity: number, executionPrice: number): Promise<void> {
      logger.info(`Trade executed: ${quantity} ${buyOrder.symbol} @ ${executionPrice} between ${buyOrder.userId} and ${sellOrder.userId}`);
  
      const totalCost = quantity * executionPrice;
  
      if (buyOrder.userId !== 'SIMULATED_TRADER') {
          const buyer = await getUser(buyOrder.userId);
          const buyerBalance = buyer?.balance ?? 0;
          if (buyerBalance < totalCost) {
              logger.error(`Trade failed: Buyer ${buyOrder.userId} does not have enough balance.`);
              return;
          }
          await updateUserBalance(buyOrder.userId, buyerBalance - totalCost);
          logger.info(`Buyer ${buyOrder.userId} balance updated: -$${totalCost} (Remaining: $${buyerBalance - totalCost})`);
      }
  
      if (sellOrder.userId !== 'SIMULATED_TRADER') {
            const seller = await getUser(buyOrder.userId);
            const sellerBalance = seller?.balance ?? 0;
          await updateUserBalance(sellOrder.userId, sellerBalance + totalCost);
          logger.info(`Seller ${sellOrder.userId} balance updated: +$${totalCost} (New: $${sellerBalance + totalCost})`);
      }
  
      if (buyOrder.userId !== 'SIMULATED_TRADER') {
          await upsertPortfolioEntry(buyOrder.userId, buyOrder.symbol, quantity, executionPrice);
      }
      if (sellOrder.userId !== 'SIMULATED_TRADER') {
          await upsertPortfolioEntry(sellOrder.userId, sellOrder.symbol, -quantity, executionPrice);
      }
  
      const buyOrderStatus = buyOrder.quantity === 0 ? 'FILLED' : 'PARTIALLY_FILLED';
      const sellOrderStatus = sellOrder.quantity === 0 ? 'FILLED' : 'PARTIALLY_FILLED';
  
      await updateOrderStatus(buyOrder.id, buyOrderStatus);
      await updateOrderStatus(sellOrder.id, sellOrderStatus);
  
      if (buyOrder.quantity === 0) {
          this.orderBook.removeOrder(buyOrder.id);
          logger.info(`Order ${buyOrder.id} fully executed and removed from order book.`);
      }
  
      if (sellOrder.quantity === 0) {
          this.orderBook.removeOrder(sellOrder.id);
          logger.info(`Order ${sellOrder.id} fully executed and removed from order book.`);
      }
    }
  

  public getOrderBook(): OrderBook {
    return this.orderBook;
  }
} 
