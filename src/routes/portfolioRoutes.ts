import { Router } from 'express';
import { getPortfolioController } from '../controllers/portfolioController';

const router = Router();

router.get('/', getPortfolioController);

export default router;
