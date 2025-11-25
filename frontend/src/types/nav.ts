export interface NavSnapshot {
  id: string;
  portfolioId: string;
  navValue: number;
  grossValue: number;
  netValue: number;
  feeAccrual: number;
  navPerShare: number;
  currency: string;
  calculatedAt: string;
  calculationDate: string;
  createdAt: string;
  asOfDate?: string;
  componentsCount?: number;
}

export interface NavCalculationRequest {
  portfolioId: string;
  asOfDate?: string;
}

export interface NavHistoryParams {
  portfolioId?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
}
