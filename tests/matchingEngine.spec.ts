import { MatchingEngine } from '../src/matching/matchingEngine';
import { Order } from '../src/models/order';
import { OrderBook } from '../src/matching/orderBook';
import logger from '../src/config/logger';
import { updateOrderStatus } from '../src/services/orderService';
import { upsertPortfolioEntry } from '../src/services/portfolioService';
import { updateUserBalance, getUser } from '../src/services/userService';

jest.mock('../src/config/logger');
jest.mock('../src/services/orderService');
jest.mock('../src/services/portfolioService');
jest.mock('../src/services/userService');

describe('MatchingEngine', () => {
  let matchingEngine: MatchingEngine;
  let orderBook: OrderBook;

  beforeEach(() => {
    matchingEngine = new MatchingEngine();
    orderBook = matchingEngine.getOrderBook();
    jest.clearAllMocks();
  });

  describe('matchBuyOrder (invoked via matchOrder with a BUY order)', () => {
    it('should fully match a BUY order when a matching SELL order exactly fulfills the quantity', async () => {
      const buyOrder: Order = {
        id: 1,
        userId: 'buyer',
        symbol: 'AAPL',
        quantity: 10,
        price: 150,
        type: 'BUY',
        status: 'PENDING',
        createdAt: new Date(),
      };

      const sellOrder: Order = {
        id: 2,
        userId: 'seller',
        symbol: 'AAPL',
        quantity: 10,
        price: 150,
        type: 'SELL',
        status: 'PENDING',
        createdAt: new Date(),
      };

      orderBook.addOrder(sellOrder);

      (getUser as jest.Mock).mockResolvedValue({ balance: 2000 });
      (updateUserBalance as jest.Mock).mockResolvedValue(undefined);
      (upsertPortfolioEntry as jest.Mock).mockResolvedValue(undefined);
      (updateOrderStatus as jest.Mock).mockResolvedValue(undefined);

      await matchingEngine.matchOrder(buyOrder);

      expect(orderBook.getSellOrders('AAPL')).toHaveLength(0);
      expect(orderBook.getBuyOrders('AAPL')).toHaveLength(0);

      expect(updateOrderStatus).toHaveBeenCalledWith(buyOrder.id, 'FILLED');
      expect(updateOrderStatus).toHaveBeenCalledWith(sellOrder.id, 'FILLED');
    });

    it('should partially match a BUY order when the matching SELL order quantity is less than the BUY order quantity', async () => {
      const buyOrder: Order = {
        id: 3,
        userId: 'buyer',
        symbol: 'AAPL',
        quantity: 15,
        price: 150,
        type: 'BUY',
        status: 'PENDING',
        createdAt: new Date(),
      };

      const sellOrder: Order = {
        id: 4,
        userId: 'seller',
        symbol: 'AAPL',
        quantity: 10,
        price: 150,
        type: 'SELL',
        status: 'PENDING',
        createdAt: new Date(),
      };

      orderBook.addOrder(sellOrder);

      (getUser as jest.Mock).mockResolvedValue({ balance: 2000 });
      (updateUserBalance as jest.Mock).mockResolvedValue(undefined);
      (upsertPortfolioEntry as jest.Mock).mockResolvedValue(undefined);
      (updateOrderStatus as jest.Mock).mockResolvedValue(undefined);

      await matchingEngine.matchOrder(buyOrder);

      expect(orderBook.getSellOrders('AAPL')).toHaveLength(0);
      const buyOrders = orderBook.getBuyOrders('AAPL');
      expect(buyOrders).toHaveLength(1);
      expect(buyOrders[0].id).toBe(buyOrder.id);
      expect(buyOrders[0].quantity).toBe(5);

      expect(updateOrderStatus).toHaveBeenCalledWith(buyOrder.id, 'PARTIALLY_FILLED');
      expect(updateOrderStatus).toHaveBeenCalledWith(sellOrder.id, 'FILLED');
    });

    it('should add the BUY order to the order book if no matching SELL orders are available', async () => {
      const buyOrder: Order = {
        id: 5,
        userId: 'buyer',
        symbol: 'AAPL',
        quantity: 10,
        price: 150,
        type: 'BUY',
        status: 'PENDING',
        createdAt: new Date(),
      };

      expect(orderBook.getSellOrders('AAPL')).toHaveLength(0);

      await matchingEngine.matchOrder(buyOrder);

      const buyOrders = orderBook.getBuyOrders('AAPL');
      expect(buyOrders).toHaveLength(1);
      expect(buyOrders[0]).toEqual(buyOrder);
    });

    it('should handle insufficient buyer balance gracefully', async () => {
      const buyOrder: Order = {
        id: 6,
        userId: 'buyer',
        symbol: 'AAPL',
        quantity: 10,
        price: 150,
        type: 'BUY',
        status: 'PENDING',
        createdAt: new Date(),
      };

      const sellOrder: Order = {
        id: 7,
        userId: 'seller',
        symbol: 'AAPL',
        quantity: 10,
        price: 150,
        type: 'SELL',
        status: 'PENDING',
        createdAt: new Date(),
      };

      orderBook.addOrder(sellOrder);

      (getUser as jest.Mock).mockResolvedValue({ balance: 100 });
      const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());

      await matchingEngine.matchOrder(buyOrder);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Trade failed: Buyer ${buyOrder.userId} does not have enough balance.`)
      );
      expect(updateOrderStatus).not.toHaveBeenCalled();
    });
  });

  describe('matchSellOrder (invoked via matchOrder with a SELL order)', () => {
    it('should fully match a SELL order when a matching BUY order exactly fulfills the quantity', async () => {
      const sellOrder: Order = {
        id: 8,
        userId: 'seller',
        symbol: 'AAPL',
        quantity: 10,
        price: 150,
        type: 'SELL',
        status: 'PENDING',
        createdAt: new Date(),
      };

      const buyOrder: Order = {
        id: 9,
        userId: 'buyer',
        symbol: 'AAPL',
        quantity: 10,
        price: 150,
        type: 'BUY',
        status: 'PENDING',
        createdAt: new Date(),
      };

      orderBook.addOrder(buyOrder);

      (getUser as jest.Mock).mockResolvedValue({ balance: 2000 });
      (updateUserBalance as jest.Mock).mockResolvedValue(undefined);
      (upsertPortfolioEntry as jest.Mock).mockResolvedValue(undefined);
      (updateOrderStatus as jest.Mock).mockResolvedValue(undefined);

      await matchingEngine.matchOrder(sellOrder);

      expect(orderBook.getBuyOrders('AAPL')).toHaveLength(0);
      expect(orderBook.getSellOrders('AAPL')).toHaveLength(0);

      expect(updateOrderStatus).toHaveBeenCalledWith(buyOrder.id, 'FILLED');
      expect(updateOrderStatus).toHaveBeenCalledWith(sellOrder.id, 'FILLED');
    });

    it('should partially match a SELL order when the BUY order quantity is less than the SELL order quantity', async () => {
      const sellOrder: Order = {
        id: 10,
        userId: 'seller',
        symbol: 'AAPL',
        quantity: 15,
        price: 150,
        type: 'SELL',
        status: 'PENDING',
        createdAt: new Date(),
      };

      const buyOrder: Order = {
        id: 11,
        userId: 'buyer',
        symbol: 'AAPL',
        quantity: 10,
        price: 150,
        type: 'BUY',
        status: 'PENDING',
        createdAt: new Date(),
      };

      orderBook.addOrder(buyOrder);

      (getUser as jest.Mock).mockResolvedValue({ balance: 2000 });
      (updateUserBalance as jest.Mock).mockResolvedValue(undefined);
      (upsertPortfolioEntry as jest.Mock).mockResolvedValue(undefined);
      (updateOrderStatus as jest.Mock).mockResolvedValue(undefined);

      await matchingEngine.matchOrder(sellOrder);

      expect(orderBook.getBuyOrders('AAPL')).toHaveLength(0);
      const sellOrders = orderBook.getSellOrders('AAPL');
      expect(sellOrders).toHaveLength(1);
      expect(sellOrders[0].id).toBe(sellOrder.id);
      expect(sellOrders[0].quantity).toBe(5);

      expect(updateOrderStatus).toHaveBeenCalledWith(buyOrder.id, 'FILLED');
      expect(updateOrderStatus).toHaveBeenCalledWith(sellOrder.id, 'PARTIALLY_FILLED');
    });

    it('should add the SELL order to the order book if no matching BUY orders are available', async () => {
      const sellOrder: Order = {
        id: 12,
        userId: 'seller',
        symbol: 'AAPL',
        quantity: 10,
        price: 150,
        type: 'SELL',
        status: 'PENDING',
        createdAt: new Date(),
      };

      expect(orderBook.getBuyOrders('AAPL')).toHaveLength(0);

      await matchingEngine.matchOrder(sellOrder);

      const sellOrders = orderBook.getSellOrders('AAPL');
      expect(sellOrders).toHaveLength(1);
      expect(sellOrders[0]).toEqual(sellOrder);
    });
  });

  describe('executeTrade via matchOrder', () => {
    it('should update balances, portfolio entries, and order statuses when a trade executes', async () => {
      const buyOrder: Order = {
        id: 13,
        userId: 'buyer',
        symbol: 'AAPL',
        quantity: 10,
        price: 150,
        type: 'BUY',
        status: 'PENDING',
        createdAt: new Date(),
      };

      const sellOrder: Order = {
        id: 14,
        userId: 'seller',
        symbol: 'AAPL',
        quantity: 10,
        price: 150,
        type: 'SELL',
        status: 'PENDING',
        createdAt: new Date(),
      };

      orderBook.addOrder(sellOrder);

      (getUser as jest.Mock).mockResolvedValue({ balance: 2000 });
      (updateUserBalance as jest.Mock).mockResolvedValue(undefined);
      (upsertPortfolioEntry as jest.Mock).mockResolvedValue(undefined);
      (updateOrderStatus as jest.Mock).mockResolvedValue(undefined);

      await matchingEngine.matchOrder(buyOrder);

      const totalCost = 10 * 150;

      expect(updateUserBalance).toHaveBeenCalledWith(buyOrder.userId, 2000 - totalCost);
      expect(updateUserBalance).toHaveBeenCalledWith(sellOrder.userId, 2000 + totalCost);

      expect(upsertPortfolioEntry).toHaveBeenCalledWith(buyOrder.userId, buyOrder.symbol, 10, sellOrder.price);
      expect(upsertPortfolioEntry).toHaveBeenCalledWith(sellOrder.userId, sellOrder.symbol, -10, sellOrder.price);

      expect(updateOrderStatus).toHaveBeenCalledWith(buyOrder.id, 'FILLED');
      expect(updateOrderStatus).toHaveBeenCalledWith(sellOrder.id, 'FILLED');

      expect(orderBook.getSellOrders('AAPL')).toHaveLength(0);
    });
  });
});
