import { createUser, getUser } from '../src/services/userService';
import db from '../src/config/db';

describe('User Service', () => {
  beforeAll(async () => {
    await db.init();
  });

  beforeEach(async () => {
    await new Promise<void>((resolve, reject) => {
      db.db.run('DELETE FROM users', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  it('should create a new user with the default balance', async () => {
    const TEST_USER_ID = 'test-user-1';
    
    await createUser(TEST_USER_ID);
    const user = await getUser(TEST_USER_ID);

    expect(user).toBeDefined();
    expect(user?.id).toBe(TEST_USER_ID);
    expect(user?.balance).toBe(100000);
    expect(typeof user?.createdAt).toBe('string');
  });

  it('should return undefined for a non-existent user', async () => {
    const user = await getUser('no-such-user');
    expect(user).toBeUndefined();
  });

  it('should throw an error if user already exists', async () => {
    const userId = 'duplicate-123';
    await createUser(userId);
    await expect(createUser(userId)).rejects.toThrow();
  });
});
