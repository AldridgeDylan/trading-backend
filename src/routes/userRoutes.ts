import { Router } from 'express';
import { getCurrentUserController } from '../controllers/userController';

const router = Router();

router.get('/', getCurrentUserController);

export default router;
