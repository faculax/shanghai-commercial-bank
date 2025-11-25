import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { CashEntry, cashService, CashQueryParams } from '../../services/cashService';
import styles from './CashHistoryPanel.module.css';

export interface CashHistoryPanelRef {
  refreshHistory: () => Promise<void>;
}

interface CashHistoryPanelProps {
  portfolioId?: string;
  limit?: number;
}

const CashHistoryPanel = forwardRef<CashHistoryPanelRef, CashHistoryPanelProps>((props, ref) => {
  const { portfolioId = 'DEFAULT', limit = 50 } = props;
  
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCashHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: CashQueryParams = {
        portfolioId,
        limit
      };
      
      const history = await cashService.fetchCashHistory(params);
      setCashEntries(history);
    } catch (err) {
      console.error('Error fetching cash history:', err);
      setError('Failed to load cash history. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [portfolioId, limit]);
  
  // Expose refresh method to parent components
  useImperativeHandle(ref, () => ({
    refreshHistory: fetchCashHistory
  }));

  useEffect(() => {
    fetchCashHistory();
  }, [fetchCashHistory]);

  const handleRefreshClick = () => {
    fetchCashHistory();
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    // Format: DD/MM/YYYY, HH:MM:SS
    return date.toLocaleDateString() + ', ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loading && cashEntries.length === 0) {
    return <div className={styles['cash-history-container']}>Loading cash history...</div>;
  }

  if (error) {
    return <div className={styles['cash-history-container']}>{error}</div>;
  }

  return (
    <div className={styles['cash-history-container']}>
      <div className={styles['cash-history-header']}>
        <h3>Cash Movement History</h3>
        <button className={styles['refresh-button']} onClick={handleRefreshClick}>
          <span className={styles['refresh-icon']}>↻</span> Refresh
        </button>
      </div>
      
      {cashEntries.length > 0 ? (
        <div className={styles['table-responsive-container']}>
          <table className={styles['cash-history-table']}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Balance</th>
                <th>Reason</th>
                <th>Trade ID</th>
              </tr>
            </thead>
            <tbody>
              {cashEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDateTime(entry.createdAt)}</td>
                  <td className={entry.delta >= 0 ? styles['positive'] : styles['negative']}>
                    {formatCurrency(entry.delta, entry.currency)}
                  </td>
                  <td>{entry.balance ? formatCurrency(entry.balance, entry.currency) : '-'}</td>
                  <td>{entry.reason}</td>
                  <td title={entry.tradeId || ''}>
                    {entry.tradeId 
                      ? `${entry.tradeId.substring(0, 8)}...` 
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles['empty-message']}>No cash movements recorded</div>
      )}
    </div>
  );
});

export default CashHistoryPanel;