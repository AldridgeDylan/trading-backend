import { Request, Response } from 'express';
import { getUser } from '../services/userService';

export async function getCurrentUserController(req: Request, res: Response) {
  try {
    const userId = res.locals.userId as string;
    const user = await getUser(userId);
    
    return res.json(user);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
