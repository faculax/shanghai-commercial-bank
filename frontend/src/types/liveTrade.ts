export interface LiveTrade {
  tradeId?: string;
  currencyPair: string;
  side: 'BUY' | 'SELL';
  counterparty: string;
  book: string;
  quantity: number;
  price: number;
  timestamp?: string;
}

export interface DemoConfig {
  enabled: boolean;
  tradesPerSecond: number;
  groupingIntervalSeconds: number;
  autoMxmlEnabled: boolean;
  mxmlGenerationIntervalSeconds: number;
  autoMurexEnabled: boolean;
  murexPushIntervalSeconds: number;
}