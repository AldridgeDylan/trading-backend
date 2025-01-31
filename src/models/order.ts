export interface Order {
    id: number;
    userId: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    status: 'PENDING' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED';
    createdAt: Date;
  }
  