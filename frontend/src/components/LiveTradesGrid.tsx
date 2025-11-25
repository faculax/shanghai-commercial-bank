import React, { useState, useEffect } from 'react';
import { LiveTrade } from '../types/liveTrade';
import { liveTradeService } from '../services/liveTradeService';

interface LiveTradesGridProps {
  refreshTrigger: number;
}

export const LiveTradesGrid: React.FC<LiveTradesGridProps> = ({ refreshTrigger }) => {
  const [pendingTrades, setPendingTrades] = useState<LiveTrade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPendingTrades = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const trades = await liveTradeService.getPendingTrades();
      setPendingTrades(trades);
    } catch (error) {
      setError('Failed to load pending trades');
      console.error('Failed to load pending trades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingTrades();
  }, [refreshTrigger]);

  // Auto-refresh every 2 seconds
  useEffect(() => {
    const interval = setInterval(loadPendingTrades, 2000);
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (error) {
    return (
      <div className="bg-fd-darker rounded-lg border border-fd-border p-6">
        <div className="text-center text-red-400">
          <p>{error}</p>
          <button 
            onClick={loadPendingTrades}
            className="btn btn-outline mt-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-fd-darker rounded-lg border border-fd-border">
      <div className="p-4 border-b border-fd-border flex justify-between items-center">
        <h3 className="text-lg font-semibold text-fd-text">
          Pending Live Trades ({pendingTrades.length})
        </h3>
        <div className="flex items-center space-x-2">
          {isLoading && (
            <div className="w-4 h-4 bg-fd-green rounded-full animate-pulse"></div>
          )}
          <span className="text-xs text-fd-text-muted">Auto-refreshing</span>
        </div>
      </div>

      {pendingTrades.length === 0 ? (
        <div className="text-center text-fd-text-muted py-16">
          <p className="text-lg">No pending trades</p>
          <p className="text-sm mt-2">
            {isLoading ? 'Loading...' : 'Enable demo mode or wait for live trades to appear here'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th>Trade ID</th>
                <th>Currency Pair</th>
                <th>Side</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Counterparty</th>
                <th>Book</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {pendingTrades.map((trade, index) => (
                <tr key={trade.tradeId || index}>
                  <td className="font-mono text-sm">{trade.tradeId}</td>
                  <td className="font-medium">{trade.currencyPair}</td>
                  <td>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      trade.side === 'BUY' 
                        ? 'bg-green-900 text-green-300' 
                        : 'bg-red-900 text-red-300'
                    }`}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="text-right font-mono">{trade.quantity.toLocaleString()}</td>
                  <td className="text-right font-mono">{Number(trade.price).toFixed(4)}</td>
                  <td>{trade.counterparty}</td>
                  <td>{trade.book}</td>
                  <td className="text-sm text-fd-text-muted font-mono">
                    {trade.timestamp ? formatTimestamp(trade.timestamp) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};