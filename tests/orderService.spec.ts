import { 
    getPendingOrders, 
    cancelOrder, 
    createOrder, 
    updateOrderStatus 
  } from '../src/services/orderService';
  import dbObj from '../src/config/db';
  import logger from '../src/config/logger';
  import { MatchingEngine } from '../src/matching/matchingEngine';
  import * as orderModule from '../src/services/orderService';
  
  const db = dbObj.db;
  
  jest.mock('../src/config/db', () => ({
    db: {
      all: jest.fn(),
      run: jest.fn(),
    },
  }));
  
  jest.mock('../src/config/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }));
  
  const mockOrderBook = {
    addOrder: jest.fn(),
    removeOrder: jest.fn(),
    buys: [],
    sells: [],
    getBestBuy: jest.fn(),
    getBestSell: jest.fn(),
    getBuyOrders: jest.fn(),
    getSellOrders: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(MatchingEngine.prototype, 'getOrderBook').mockReturnValue(mockOrderBook as any);
    jest.spyOn(MatchingEngine.prototype, 'matchOrder').mockResolvedValue();
  });
  
  describe('Order Service Functions', () => {
  
    describe('getPendingOrders', () => {
      it('should resolve with rows if db.all returns rows', async () => {
        const fakeRows = [{ id: 1, status: 'PENDING' }];
        (db.all as jest.Mock).mockImplementation(
          (sql: string, params: any[], callback: (err: Error | null, rows?: any[]) => void) => {
            callback(null, fakeRows);
          }
        );
        await expect(getPendingOrders('user1')).resolves.toEqual(fakeRows);
      });
  
      it('should resolve with an empty array if rows are undefined', async () => {
        (db.all as jest.Mock).mockImplementation(
          (sql: string, params: any[], callback: (err: Error | null, rows?: any[]) => void) => {
            callback(null, undefined);
          }
        );
        await expect(getPendingOrders('user1')).resolves.toEqual([]);
      });
  
      it('should reject if db.all returns an error', async () => {
        const error = new Error('DB error');
        (db.all as jest.Mock).mockImplementation(
          (sql: string, params: any[], callback: (err: Error | null, rows?: any[]) => void) => {
            callback(error);
          }
        );
        await expect(getPendingOrders('user1')).rejects.toThrow('DB error');
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Error fetching pending orders for userId=user1')
        );
      });
    });
  
    describe('cancelOrder', () => {
        it('should reject if db.run returns an error', async () => {
          const error = new Error('Run error');
          (db.run as jest.Mock).mockImplementation(
            (sql: string, params: any[], callback: Function) => {
              callback.call({ changes: 0 }, error);
            }
          );
          await expect(cancelOrder('user1', 1)).rejects.toThrow('Run error');
          expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('Error canceling order: userId=user1, orderId=1')
          );
        });
      
        it('should reject if no pending order is found (changes = 0)', async () => {
          (db.run as jest.Mock).mockImplementation(
            (sql: string, params: any[], callback: Function) => {
              callback.call({ changes: 0 }, null);
            }
          );
          await expect(cancelOrder('user1', 1)).rejects.toThrow(
            'No pending order found for userId=user1 with orderId=1'
          );
          expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('No pending order found to cancel: userId=user1, orderId=1')
          );
        });
      
        it('should cancel the order if a pending order is found (changes > 0)', async () => {
          (db.run as jest.Mock).mockImplementation((sql, params, callback) => {
            callback.call({ changes: 1 }, null);
          });
        
          await expect(cancelOrder('user1', 1)).resolves.toBeUndefined();
          expect(mockOrderBook.removeOrder).toHaveBeenCalledWith(1);
          expect(logger.info).toHaveBeenCalledWith(
            expect.stringContaining('Order successfully canceled: userId=user1, orderId=1')
          );
        });
      });
  
    describe('createOrder', () => {
      it('should reject if db.run returns an error during order creation', async () => {
        const error = new Error('Insert error');
        (db.run as jest.Mock).mockImplementation(
          (sql: string, params: any[], callback: Function) => {
            callback.call({}, error);
          }
        );
        await expect(
          createOrder('user1', 'AAPL', 10, 150, 'BUY', 'LIMIT')
        ).rejects.toThrow('Insert error');
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error creating order:'));
      });
  
      it('should create an order successfully if db.run returns success', async () => {
        (db.run as jest.Mock).mockImplementation(
          (sql: string, params: any[], callback: Function) => {
            callback.call({ lastID: 42 }, null);
          }
        );
  
        await expect(
          createOrder('user1', 'AAPL', 10, 150, 'BUY', 'LIMIT')
        ).resolves.toBeUndefined();
  
        expect(mockOrderBook.addOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 42,
            userId: 'user1',
            symbol: 'AAPL',
            quantity: 10,
            price: 150,
            status: 'PENDING'
          })
        );
        expect(logger.info).toHaveBeenCalledWith(
          expect.stringContaining('Order added to order book:')
        );
        // And ensure that matchOrder was triggered on the new order.
        expect(MatchingEngine.prototype.matchOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 42,
            userId: 'user1',
            symbol: 'AAPL'
          })
        );
      });
    });
  
    describe('updateOrderStatus', () => {
      it('should update order status successfully', async () => {
        (db.run as jest.Mock).mockImplementation(
          (sql: string, params: any[], callback: Function) => {
            callback.call({}, null);
          }
        );
        await expect(updateOrderStatus(1, 'FILLED')).resolves.toBeUndefined();
        await new Promise(resolve => setImmediate(resolve));
        expect(logger.info).toHaveBeenCalledWith(
          expect.stringContaining('Order status updated: orderId=1, status=FILLED')
        );
      });
  
      it('should reject if db.run returns an error when updating order status', async () => {
        const error = new Error('Update error');
        (db.run as jest.Mock).mockImplementation(
          (sql: string, params: any[], callback: Function) => {
            callback.call({}, error);
          }
        );
        await expect(updateOrderStatus(1, 'FILLED')).rejects.toThrow('Update error');
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Error updating order status: orderId=1, status=FILLED')
        );
      });
    });
  });
  