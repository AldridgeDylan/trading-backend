import { Request, Response } from 'express';
import { getPendingOrders, createOrder, cancelOrder } from '../services/orderService';

export async function getPendingOrdersController(req: Request, res: Response) {
  try {
    const userId = res.locals.userId;
    const orders = await getPendingOrders(userId);
    return res.json(orders);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createOrderController(req: Request, res: Response) {
  try {
    const userId = res.locals.userId;
    const { symbol, quantity, price, direction, type } = req.body;

    if (!symbol || !quantity || !price || !direction || !type) {
        return res.status(400).json({ error: 'symbol, quantity, price, direction, and type are required' });
    }

    await createOrder(userId, symbol, quantity, price, direction, type);
    res.status(201).json({ message: 'Order created successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function cancelOrderController(req: Request, res: Response) {
    try {
        const userId = res.locals.userId;
        const { orderId } = req.body;
    
        await cancelOrder(userId, orderId);
        res.json({ message: 'Pending order deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
