export interface Trade {
  id: string;
  tradeId: string;
  isin: string;
  quantity: number;
  price: number;
  side?: 'BUY' | 'SELL';
  tradeDate: string;
  settleDate: string;
  createdAt: string;
  updatedAt?: string;
}
