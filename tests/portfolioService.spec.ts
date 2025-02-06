import * as portfolioService from '../src/services/portfolioService';
  import dbObj from '../src/config/db';
  import logger from '../src/config/logger';
  
  const db = dbObj.db;
  
  jest.mock('../src/config/db', () => ({
    db: {
      all: jest.fn(),
      run: jest.fn(),
      get: jest.fn(),
    },
  }));
  
  jest.mock('../src/config/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
  }));
  
  describe('Portfolio Service', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    describe('getPortfolio', () => {
      it('should resolve with rows when db.all succeeds', async () => {
        const fakeRows = [
          { userId: 'user1', symbol: 'AAPL', quantity: 10, avgPrice: 150 }
        ];
        (db.all as jest.Mock).mockImplementation((sql: string, params: any[], callback: (err: Error | null, rows?: any[]) => void) => {
          callback(null, fakeRows);
        });
  
        await expect(portfolioService.getPortfolio('user1')).resolves.toEqual(fakeRows);
      });
  
      it('should resolve with an empty array if no rows returned', async () => {
        (db.all as jest.Mock).mockImplementation((sql: string, params: any[], callback: (err: Error | null, rows?: any[]) => void) => {
          callback(null, undefined);
        });
  
        await expect(portfolioService.getPortfolio('user1')).resolves.toEqual([]);
      });
  
      it('should reject if db.all returns an error', async () => {
        const err = new Error('db error');
        (db.all as jest.Mock).mockImplementation((sql: string, params: any[], callback: (err: Error | null, rows?: any[]) => void) => {
          callback(err);
        });
  
        await expect(portfolioService.getPortfolio('user1')).rejects.toThrow('db error');
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error fetching portfolio for user: user1'));
      });
    });
  
    describe('upsertPortfolioEntry', () => {
      it('should upsert portfolio entry successfully', async () => {
        (db.run as jest.Mock).mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
          callback(null);
        });
  
        await expect(portfolioService.upsertPortfolioEntry('user1', 'AAPL', 10, 150)).resolves.toBeUndefined();
        expect(logger.info).toHaveBeenCalledWith(
          expect.stringContaining('Portfolio entry upserted: userId=user1, symbol=AAPL, quantity=10, price=150')
        );
      });
  
      it('should reject if db.run returns an error', async () => {
        const err = new Error('upsert error');
        (db.run as jest.Mock).mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
          callback(err);
        });
  
        await expect(portfolioService.upsertPortfolioEntry('user1', 'AAPL', 10, 150)).rejects.toThrow('upsert error');
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Error upserting portfolio entry: userId=user1, symbol=AAPL')
        );
      });
    });
  
    describe('deletePortfolioEntry', () => {
      it('should delete portfolio entry successfully', async () => {
        (db.run as jest.Mock).mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
          callback(null);
        });
  
        await expect(portfolioService.deletePortfolioEntry('user1', 'AAPL')).resolves.toBeUndefined();
        expect(logger.info).toHaveBeenCalledWith(
          expect.stringContaining('Portfolio entry deleted: userId=user1, symbol=AAPL')
        );
      });
  
      it('should reject if db.run returns an error when deleting', async () => {
        const err = new Error('delete error');
        (db.run as jest.Mock).mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
          callback(err);
        });
  
        await expect(portfolioService.deletePortfolioEntry('user1', 'AAPL')).rejects.toThrow('delete error');
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Error deleting portfolio entry: userId=user1, symbol=AAPL')
        );
      });
    });
  
    describe('reducePortfolioEntry', () => {
      it('should reduce portfolio entry quantity and resolve if remaining quantity > 0', async () => {
        (db.run as jest.Mock).mockImplementationOnce((sql: string, params: any[], callback: (err: Error | null) => void) => {
          callback(null);
        });
        (db.get as jest.Mock).mockImplementationOnce((sql: string, params: any[], callback: (err: Error | null, row?: { quantity: number }) => void) => {
          callback(null, { quantity: 5 });
        });
  
        await expect(portfolioService.reducePortfolioEntry('user1', 'AAPL', 5)).resolves.toBeUndefined();
      });
  
      it('should reduce portfolio entry quantity and delete the entry if remaining quantity <= 0', async () => {
        (db.run as jest.Mock).mockImplementationOnce((sql: string, params: any[], callback: (err: Error | null) => void) => {
          callback(null);
        });
        (db.get as jest.Mock).mockImplementationOnce((sql: string, params: any[], callback: (err: Error | null, row?: { quantity: number }) => void) => {
          callback(null, { quantity: 0 });
        });
  
        await expect(portfolioService.reducePortfolioEntry('user1', 'AAPL', 5)).rejects.toThrow('delete error');

      });
  
      it('should reject if update query fails in reducePortfolioEntry', async () => {
        const err = new Error('update error');
        (db.run as jest.Mock).mockImplementationOnce((sql: string, params: any[], callback: (err: Error | null) => void) => {
          callback(err);
        });
  
        await expect(portfolioService.reducePortfolioEntry('user1', 'AAPL', 5)).rejects.toThrow('update error');
      });
  
      it('should reject if db.get fails in reducePortfolioEntry', async () => {
        (db.run as jest.Mock).mockImplementationOnce((sql: string, params: any[], callback: (err: Error | null) => void) => {
          callback(null);
        });
        const err = new Error('get error');
        (db.get as jest.Mock).mockImplementationOnce((sql: string, params: any[], callback: (err: Error | null, row?: any) => void) => {
          callback(err);
        });
  
        await expect(portfolioService.reducePortfolioEntry('user1', 'AAPL', 5)).rejects.toThrow('get error');
      });
    });
  });
  