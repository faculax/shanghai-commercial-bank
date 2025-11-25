import { API_BASE_URL } from '../config/api';

export interface CashBalance {
  balance: number;
  currency: string;
  portfolioId?: string;
  lastUpdated?: string;
}

export interface CashEntry {
  id: string;
  portfolioId: string;
  amount: number;
  delta: number;
  currency: string;
  description: string;
  reason: string;
  transactionDate: string;
  createdAt: string;
  balance?: number;
  tradeId?: string;
}

export interface CashFetchParams {
  portfolioId?: string;
}

export interface CashQueryParams {
  portfolioId?: string;
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}

class CashService {
  async fetchCashBalance(params: CashFetchParams = {}): Promise<CashBalance> {
    const { portfolioId = 'DEFAULT' } = params;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/cash?portfolioId=${portfolioId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cash balance: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching cash balance:', error);
      throw error;
    }
  }
  
  async fetchCashHistory(params: CashQueryParams = {}): Promise<CashEntry[]> {
    const { portfolioId = 'DEFAULT', limit = 50, offset = 0, startDate, endDate } = params;
    
    try {
      const queryParams = new URLSearchParams({
        portfolioId,
        limit: limit.toString(),
        offset: offset.toString()
      });
      
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const response = await fetch(`${API_BASE_URL}/api/cash/history?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cash history: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching cash history:', error);
      throw error;
    }
  }
}

export const cashService = new CashService();
