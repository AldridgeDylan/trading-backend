import { createOrder } from '../services/orderService';
import getStockPrice from './priceUpdator';
import logger from '../config/logger';

// Simulation settings
const MIN_SPREAD = 0.2;
const MAX_SPREAD = 1.5;
const ORDER_QUANTITY_RANGE = [1, 20];
const SIMULATION_INTERVAL = 5000; // 5 seconds

export async function simulateCycle(): Promise<void> {
  const symbols = ['NVDA']; // Simulated stocks
  for (const symbol of symbols) {
    const marketPrice = await getStockPrice(symbol);
    if (!marketPrice) {
      logger.warn(`Skipping simulation: No market price available for ${symbol}`);
      continue;
    }
    const spread = Math.random() * (MAX_SPREAD - MIN_SPREAD) + MIN_SPREAD;
    const bidPrice = Math.round((marketPrice - spread / 2) * 100) / 100;
    const askPrice = Math.round((marketPrice + spread / 2) * 100) / 100;

    const buyQuantity = getRandomQuantity();
    const sellQuantity = getRandomQuantity();

    await createOrder('SIMULATED_TRADER', symbol, buyQuantity, bidPrice, 'BUY');
    await createOrder('SIMULATED_TRADER', symbol, sellQuantity, askPrice, 'SELL');

    logger.info(`Simulated order book update for ${symbol}:`);
    logger.info(`→ BUY ${buyQuantity} @ ${bidPrice}`);
    logger.info(`→ SELL ${sellQuantity} @ ${askPrice}`);
  }
}

export function startOrderBookSimulation(): NodeJS.Timeout {
  return setInterval(simulateCycle, SIMULATION_INTERVAL);
}

function getRandomQuantity(): number {
  return Math.floor(
    Math.random() * (ORDER_QUANTITY_RANGE[1] - ORDER_QUANTITY_RANGE[0] + 1)
  ) + ORDER_QUANTITY_RANGE[0];
}
