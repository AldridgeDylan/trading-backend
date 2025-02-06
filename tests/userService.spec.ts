import { createUser, getUser, updateUserBalance } from '../src/services/userService';
import dbObj from '../src/config/db';
import logger from '../src/config/logger';

const db = dbObj.db;

jest.mock('../src/config/db', () => ({
  db: {
    run: jest.fn(),
    get: jest.fn(),
  },
}));

jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      (db.run as jest.Mock).mockImplementation(
        (sql: string, params: any[], callback: (err: Error | null) => void) => {
          callback(null);
        }
      );

      await expect(createUser('user1')).resolves.toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Created user with id=user1'));
    });

    it('should reject with a constraint error if user already exists', async () => {
      const err = new Error('constraint error');
      (err as any).code = 'SQLITE_CONSTRAINT';
      (db.run as jest.Mock).mockImplementation(
        (sql: string, params: any[], callback: (err: Error | null) => void) => {
          callback(err);
        }
      );

      await expect(createUser('user1')).rejects.toThrow('User with id=user1 already exists');
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error creating user: user1'));
    });

    it('should reject if a non-constraint error occurs', async () => {
      const err = new Error('some error');
      (db.run as jest.Mock).mockImplementation(
        (sql: string, params: any[], callback: (err: Error | null) => void) => {
          callback(err);
        }
      );

      await expect(createUser('user1')).rejects.toThrow('some error');
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error creating user: user1'));
    });
  });

  describe('getUser', () => {
    it('should resolve with the user row if found', async () => {
      const userRow = { id: 'user1', balance: 100000, createdAt: '2020-01-01' };

      (db.get as jest.Mock).mockImplementation(
        (sql: string, params: any[], callback: (err: Error | null, row?: any) => void) => {
          callback(null, userRow);
        }
      );

      await expect(getUser('user1')).resolves.toEqual(userRow);
    });

    it('should resolve with undefined if the user is not found', async () => {
      (db.get as jest.Mock).mockImplementation(
        (sql: string, params: any[], callback: (err: Error | null, row?: any) => void) => {
          callback(null, undefined);
        }
      );

      await expect(getUser('user1')).resolves.toBeUndefined();
    });

    it('should reject if an error occurs in db.get', async () => {
      const err = new Error('db error');
      (db.get as jest.Mock).mockImplementation(
        (sql: string, params: any[], callback: (err: Error | null, row?: any) => void) => {
          callback(err);
        }
      );

      await expect(getUser('user1')).rejects.toThrow('db error');
    });
  });

  describe('updateUserBalance', () => {
    it('should update user balance successfully', async () => {
      (db.run as jest.Mock).mockImplementation(
        (sql: string, params: any[], callback: (err: Error | null) => void) => {
          callback(null);
        }
      );

      await expect(updateUserBalance('user1', 50000)).resolves.toBeUndefined();
    });

    it('should reject if an error occurs during update', async () => {
      const err = new Error('update error');
      (db.run as jest.Mock).mockImplementation(
        (sql: string, params: any[], callback: (err: Error | null) => void) => {
          callback(err);
        }
      );

      await expect(updateUserBalance('user1', 50000)).rejects.toThrow('update error');
    });
  });
});
