import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getUser, createUser } from '../services/userService';

function userIdCookie() {
  return async (req: Request, res: Response, next: NextFunction) => {
    let userId = req.cookies?.userId as string | undefined;

    if (!userId) {
      userId = crypto.randomUUID();
      res.cookie('userId', userId, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
      });
      await createUser(userId);
      res.locals.userId = userId;
    } else {
      const user = await getUser(userId);
      if (!user) {
        await createUser(userId);
      }
      res.locals.userId = userId;
    }

    next();
  };
}

export default userIdCookie();
