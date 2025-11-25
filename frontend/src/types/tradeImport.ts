export interface Trade {
  id: number;
  tradeId: string;
  currencyPair: string;
  side: 'BUY' | 'SELL';
  counterparty: string;
  book: string;
  quantity?: number;
  price?: number;
  createdAt: string;
}

export interface MXMLFile {
  id: number;
  filename: string;
  content?: string;
  createdAt: string;
}

export interface TradeImport {
  id: number;
  importName: string;
  status: 'IMPORTED' | 'CONSOLIDATED' | 'MXML_GENERATED' | 'PUSHED_TO_MUREX';
  consolidationCriteria?: 'CURRENCY_PAIR' | 'COUNTERPARTY' | 'BOOK' | 'CURRENCY_PAIR_AND_COUNTERPARTY' | 'CURRENCY_PAIR_AND_BOOK' | 'COUNTERPARTY_AND_BOOK' | 'ALL_CRITERIA';
  originalTradeCount: number;
  currentTradeCount: number;
  mxmlGenerated: boolean;
  pushedToMurex: boolean;
  createdAt: string;
  consolidatedAt?: string;
  mxmlGeneratedAt?: string;
  pushedToMurexAt?: string;
  trades?: Trade[];
  mxmlFiles?: MXMLFile[];
}

export interface ConsolidationRequest {
  criteria: 'CURRENCY_PAIR' | 'COUNTERPARTY' | 'BOOK' | 'CURRENCY_PAIR_AND_COUNTERPARTY' | 'CURRENCY_PAIR_AND_BOOK' | 'COUNTERPARTY_AND_BOOK' | 'ALL_CRITERIA';
}
