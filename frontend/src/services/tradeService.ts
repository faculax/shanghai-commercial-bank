import { API_BASE_URL } from '../config/api';
import { Trade } from '../types/trade';

export interface TradeFetchParams {
  limit?: number;
  offset?: number;
  portfolioId?: string;
}

class TradeService {
  async fetchRecentTrades(params: TradeFetchParams = {}): Promise<Trade[]> {
    const { limit = 50, offset = 0, portfolioId = 'DEFAULT' } = params;
    
    try {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        portfolioId: portfolioId
      });
      
      const response = await fetch(`${API_BASE_URL}/api/trades?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching trades:', error);
      throw error;
    }
  }
  
  async createTrade(trade: Partial<Trade>): Promise<Trade> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trade),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create trade: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating trade:', error);
      throw error;
    }
  }
}

export const tradeService = new TradeService();
