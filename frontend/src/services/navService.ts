import { API_BASE_URL } from '../config/api';
import { NavSnapshot, NavCalculationRequest, NavHistoryParams } from '../types/nav';

class NavService {
  /**
   * Get the latest NAV snapshot for a portfolio
   */
  async getLatest(portfolioId: string = 'DEFAULT'): Promise<NavSnapshot | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/nav/latest?portfolioId=${portfolioId}`);
      
      if (response.status === 404) {
        // No NAV snapshot found yet
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch latest NAV: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching latest NAV:', error);
      throw error;
    }
  }
  
  /**
   * Get NAV history for a portfolio
   */
  async getHistory(portfolioId: string = 'DEFAULT', limit: number = 10): Promise<NavSnapshot[]> {
    try {
      const queryParams = new URLSearchParams({
        portfolioId,
        limit: limit.toString()
      });
      
      const response = await fetch(`${API_BASE_URL}/api/nav/history?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch NAV history: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching NAV history:', error);
      throw error;
    }
  }
  
  /**
   * Trigger a NAV calculation for a portfolio
   */
  async calculate(portfolioId: string = 'DEFAULT', asOfDate?: string): Promise<NavSnapshot> {
    try {
      const request: NavCalculationRequest = {
        portfolioId,
        ...(asOfDate && { asOfDate })
      };
      
      const response = await fetch(`${API_BASE_URL}/api/nav/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to calculate NAV: ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error calculating NAV:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific NAV snapshot by ID
   */
  async getById(navId: string): Promise<NavSnapshot> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/nav/${navId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch NAV snapshot: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching NAV snapshot:', error);
      throw error;
    }
  }
}

export const navService = new NavService();
