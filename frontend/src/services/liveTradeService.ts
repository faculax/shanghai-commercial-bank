import { API_BASE_URL } from '../config/api';
import { LiveTrade, DemoConfig } from '../types/liveTrade';
import { TradeImport } from '../types/tradeImport';

export const liveTradeService = {
  async submitLiveTrade(trade: LiveTrade): Promise<LiveTrade> {
    const response = await fetch(`${API_BASE_URL}/live-trades/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trade),
    });

    if (!response.ok) {
      throw new Error('Failed to submit live trade');
    }

    return response.json();
  },

  async processPendingTrades(): Promise<TradeImport | null> {
    const response = await fetch(`${API_BASE_URL}/live-trades/process`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to process pending trades');
    }

    const data = await response.json();
    return data;
  },

  async getPendingTradeCount(): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/live-trades/pending-count`);

    if (!response.ok) {
      throw new Error('Failed to get pending trade count');
    }

    return response.json();
  },

  async getPendingTrades(): Promise<LiveTrade[]> {
    const response = await fetch(`${API_BASE_URL}/live-trades/pending`);

    if (!response.ok) {
      throw new Error('Failed to get pending trades');
    }

    return response.json();
  },

  async getDemoConfig(): Promise<DemoConfig> {
    const response = await fetch(`${API_BASE_URL}/live-trades/demo-config`);

    if (!response.ok) {
      throw new Error('Failed to get demo config');
    }

    return response.json();
  },

  async updateDemoConfig(config: DemoConfig): Promise<DemoConfig> {
    const response = await fetch(`${API_BASE_URL}/live-trades/demo-config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to update demo config');
    }

    return response.json();
  },
};