import { Router } from 'express';
import { getPendingOrdersController, createOrderController, cancelOrderController } from '../controllers/orderController';

const router = Router();

router.get('/', getPendingOrdersController);
router.post('/', createOrderController);
router.delete('/:id', cancelOrderController);

export default router;
