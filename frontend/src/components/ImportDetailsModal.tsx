import React, { useState, useEffect } from 'react';
import { TradeImport, Trade } from '../types/tradeImport';
import { tradeImportService } from '../services/tradeImportService';

interface ImportDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeImport: TradeImport | null;
}

export const ImportDetailsModal: React.FC<ImportDetailsModalProps> = ({
  isOpen,
  onClose,
  tradeImport,
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'original' | 'consolidated'>('current');
  const [originalTrades, setOriginalTrades] = useState<Trade[]>([]);
  const [consolidatedTrades, setConsolidatedTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (tradeImport && tradeImport.status !== 'IMPORTED') {
      setActiveTab('consolidated');
    } else {
      setActiveTab('current');
    }
  }, [tradeImport]);

  const loadOriginalTrades = async () => {
    if (!tradeImport) return;
    setIsLoading(true);
    try {
      const trades = await tradeImportService.getOriginalTrades(tradeImport.id);
      setOriginalTrades(trades);
    } catch (error) {
      console.error('Failed to load original trades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConsolidatedTrades = async () => {
    if (!tradeImport) return;
    setIsLoading(true);
    try {
      const trades = await tradeImportService.getConsolidatedTrades(tradeImport.id);
      setConsolidatedTrades(trades);
    } catch (error) {
      console.error('Failed to load consolidated trades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = async (tab: 'current' | 'original' | 'consolidated') => {
    setActiveTab(tab);
    if (tab === 'original' && originalTrades.length === 0) {
      await loadOriginalTrades();
    } else if (tab === 'consolidated' && consolidatedTrades.length === 0) {
      await loadConsolidatedTrades();
    }
  };

  if (!isOpen || !tradeImport) return null;

  const getCurrentTrades = () => {
    if (activeTab === 'original') return originalTrades;
    if (activeTab === 'consolidated') return consolidatedTrades;
    return tradeImport.trades || [];
  };

  const getTradesTitle = () => {
    if (activeTab === 'original') return `Original Trades (${originalTrades.length})`;
    if (activeTab === 'consolidated') return `Consolidated Trades (${consolidatedTrades.length})`;
    return `Trades (${tradeImport.trades?.length || 0})`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-fd-darker border border-fd-border rounded-lg shadow-fd max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="card-header flex justify-between items-center">
          <h2 className="text-xl font-semibold text-fd-text">
            Import Details: {tradeImport.importName}
          </h2>
          <button
            onClick={onClose}
            className="text-fd-text-muted hover:text-fd-text"
          >
            ✕
          </button>
        </div>

        <div className="card-body overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-fd-text mb-2">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-fd-text-muted text-sm">Status</p>
                <p className="text-fd-text">{tradeImport.status.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-fd-text-muted text-sm">Original Count</p>
                <p className="text-fd-text">{tradeImport.originalTradeCount}</p>
              </div>
              <div>
                <p className="text-fd-text-muted text-sm">Current Count</p>
                <p className="text-fd-text">{tradeImport.currentTradeCount}</p>
              </div>
              <div>
                <p className="text-fd-text-muted text-sm">Created</p>
                <p className="text-fd-text text-sm">
                  {new Date(tradeImport.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-fd-text">
                {getTradesTitle()}
              </h3>
              
              {/* Tabs for trade views */}
              {tradeImport.status !== 'IMPORTED' && (
                <div className="nav-tabs">
                  <button
                    className={`nav-tab ${activeTab === 'original' ? 'active' : 'inactive'}`}
                    onClick={() => handleTabChange('original')}
                  >
                    Original
                  </button>
                  <button
                    className={`nav-tab ${activeTab === 'consolidated' ? 'active' : 'inactive'}`}
                    onClick={() => handleTabChange('consolidated')}
                  >
                    Consolidated
                  </button>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-fd-text-muted">Loading trades...</div>
            ) : getCurrentTrades().length > 0 ? (
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
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {getCurrentTrades().map((trade) => (
                      <tr key={trade.id}>
                        <td className="font-mono">{trade.tradeId}</td>
                        <td className="font-mono">{trade.currencyPair}</td>
                        <td>
                          <span className={trade.side === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                            {trade.side}
                          </span>
                        </td>
                        <td className="text-right font-mono">
                          {trade.quantity ? trade.quantity.toLocaleString() : '-'}
                        </td>
                        <td className="text-right font-mono">
                          {trade.price ? trade.price.toFixed(6) : '-'}
                        </td>
                        <td>{trade.counterparty}</td>
                        <td>{trade.book}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-fd-text-muted">
                No {activeTab} trades found
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-fd-border">
          <button onClick={onClose} className="btn btn-outline">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
