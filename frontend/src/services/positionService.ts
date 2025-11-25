import { API_BASE_URL } from '../config/api';

export interface Position {
  isin: string;
  quantity: number;
  lastUpdated: string;
  portfolioId?: string;
}

export interface PositionFetchParams {
  portfolioId?: string;
}

class PositionService {
  async fetchPositions(params: PositionFetchParams = {}): Promise<Position[]> {
    const { portfolioId = 'DEFAULT' } = params;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/positions?portfolioId=${portfolioId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  }
}

export const positionService = new PositionService();
