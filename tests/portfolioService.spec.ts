import { getPortfolio } from '../src/services/portfolioService';
import dbObj from '../src/config/db';

const db = dbObj.db;

describe('Portfolio Service', () => {
  beforeAll(async () => {
    // Create portfolio table if it doesn't exist
    await new Promise<void>((resolve, reject) => {
      db.run(
        `CREATE TABLE IF NOT EXISTS portfolio (
          userId TEXT,
          symbol TEXT,
          quantity INTEGER,
          avgPrice REAL,
          PRIMARY KEY (userId, symbol)
        )`,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  });

  beforeEach(async () => {
    // Clear the portfolio table
    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM portfolio', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  it('should return an empty portfolio for a user with no positions', async () => {
    const userId = 'test-user-1';
    const portfolio = await getPortfolio(userId);
    expect(portfolio).toEqual([]);
  });

  it('should return the portfolio for a user with positions', async () => {
    const userId = 'test-user-2';

    // Insert test data
    await new Promise<void>((resolve, reject) => {
      db.run(
        `INSERT INTO portfolio (userId, symbol, quantity, avgPrice) VALUES
         (?, ?, ?, ?)`,
        [userId, 'AAPL', 10, 150],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    const portfolio = await getPortfolio(userId);
    expect(portfolio).toEqual([
      { symbol: 'AAPL', quantity: 10, avgPrice: 150 },
    ]);
  });

});
