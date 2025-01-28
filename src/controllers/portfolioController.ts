import { Request, Response } from 'express';
import { getPortfolio } from '../services/portfolioService';

export async function getPortfolioController(req: Request, res: Response) {
  try {
    const userId = res.locals.userId;
    const portfolio = await getPortfolio(userId);
    return res.json(portfolio);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
