import { API_BASE_URL } from '../config/api';

export interface Journal {
  id: string;
  tradeId: string;
  type: 'TRADE_DATE' | 'SETTLEMENT_DATE';
  entries: JournalEntry[];
  lines: JournalLine[];
  totalDebits: number;
  totalCredits: number;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  account: string;
  debit?: number;
  credit?: number;
  currency?: string;
}

export interface JournalLine {
  account: string;
  debit: number;
  credit: number;
}

export interface JournalFetchParams {
  tradeId?: string;
  type?: 'TRADE_DATE' | 'SETTLEMENT_DATE';
}

class JournalService {
  async fetchJournals(params: JournalFetchParams = {}): Promise<Journal[]> {
    const { tradeId, type } = params;
    
    try {
      const queryParams = new URLSearchParams();
      if (tradeId) queryParams.append('tradeId', tradeId);
      if (type) queryParams.append('type', type);
      
      const response = await fetch(`${API_BASE_URL}/api/journals?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch journals: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching journals:', error);
      throw error;
    }
  }
  
  async fetchJournalById(journalId: string): Promise<Journal> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/journals/${journalId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch journal: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching journal:', error);
      throw error;
    }
  }
}

export const journalService = new JournalService();
