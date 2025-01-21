import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Middleware that assigns userId cookies if missing
import userIdCookie from './middleware/userIdCookie';

// Our route modules
import orderRoutes from './routes/orderRoutes';
import portfolioRoutes from './routes/portfolioRoutes';

const app: Application = express();

// CORS config so the frontend can call this API
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Set up the middleware
app.use(userIdCookie);

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Test endpoint
app.get('/', (req, res) => {
  res.send('Trading platform backend - TypeScript + Express + SQLite');
});

export default app;
