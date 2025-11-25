import React, { useEffect, useState, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { Trade } from '../../types/trade';
import { tradeService } from '../../services/tradeService';
import { journalService, Journal } from '../../services/journalService';
import JournalBadge from '../journal-badge/JournalBadge';
import JournalModal from '../journal-modal/JournalModal';
import styles from './TradeList.module.css';

const POLL_INTERVAL_MS = 5000;
const MAX_BACKOFF_MS = 30000;
const NEW_TRADE_HIGHLIGHT_MS = 3000;

// Define a ref type for the TradeList component
export interface TradeListRef {
  refreshTrades: () => Promise<void>;
}

export interface TradeListProps {
  // Add any props if needed
}

export const TradeList = forwardRef<TradeListRef, TradeListProps>((props, ref) => {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [newTradeIds, setNewTradeIds] = useState<Set<string>>(new Set());
    const [tradeJournals, setTradeJournals] = useState<Record<string, Journal[]>>({});
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const [showJournalModal, setShowJournalModal] = useState<boolean>(false);
    const previousTradeIds = useRef<Set<string>>(new Set());
    const pollIntervalRef = useRef<number>(POLL_INTERVAL_MS);
    const pollTimeoutRef = useRef<NodeJS.Timeout>();
    
    // Helper function to determine journal status for a trade
    const getJournalStatus = (tradeId: string) => {
        const journals = tradeJournals[tradeId] || [];
        
        if (journals.length === 0) {
            return 'none';
        }
        
        const hasSettlementJournal = journals.some(j => j.type === 'SETTLEMENT_DATE');
        return hasSettlementJournal ? 'settled' : 'trade';
    };
    
    // Handle journal badge click
    const handleJournalClick = async (trade: Trade) => {
        setSelectedTrade(trade);
        
        // Fetch journals if we don't have them yet
        if (!tradeJournals[trade.id]) {
            try {
                const journals = await journalService.fetchJournals({ tradeId: trade.tradeId });
                setTradeJournals(prev => ({
                    ...prev,
                    [trade.id]: journals
                }));
            } catch (error) {
                console.error('Error fetching journals:', error);
            }
        }
        
        setShowJournalModal(true);
    };

    const fetchTrades = useCallback(async () => {
        try {
            const fetchedTrades = await tradeService.fetchRecentTrades({ limit: 50 });
            
            // Identify new trades by comparing with previous IDs
            const currentIds = new Set(fetchedTrades.map((t: Trade) => t.id));
            const newIds = new Set<string>();
            currentIds.forEach((id: string) => {
                if (!previousTradeIds.current.has(id)) {
                    newIds.add(id);
                }
            });
            
            setTrades(fetchedTrades);
            setNewTradeIds(newIds);
            setLastUpdated(new Date());
            setError(null);
            
            // Reset backoff on success
            pollIntervalRef.current = POLL_INTERVAL_MS;
            
            // Update previous IDs for next comparison
            previousTradeIds.current = currentIds;
            
            // Clear highlight after delay
            if (newIds.size > 0) {
                setTimeout(() => {
                    setNewTradeIds(new Set());
                }, NEW_TRADE_HIGHLIGHT_MS);
                
                // Fetch journals for new trades
                for (const id of newIds) {
                    try {
                        const trade = fetchedTrades.find((t: Trade) => t.id === id);
                        if (trade) {
                            const journals = await journalService.fetchJournals({ tradeId: trade.tradeId });
                            setTradeJournals(prev => ({
                                ...prev,
                                [id]: journals
                            }));
                        }
                    } catch (error) {
                        console.error(`Error fetching journals for trade ${id}:`, error);
                    }
                }
            }
        } catch (err) {
            setError('Failed to fetch trades. Retrying...');
            // Exponential backoff
            pollIntervalRef.current = Math.min(
                pollIntervalRef.current * 2,
                MAX_BACKOFF_MS
            );
        } finally {
            setLoading(false);
        }
    }, []);
    
    // Expose the refreshTrades method via ref
    useImperativeHandle(ref, () => ({
        refreshTrades: fetchTrades
    }));

    useEffect(() => {
        // Initial fetch
        fetchTrades();

        // Setup polling
        const poll = () => {
            pollTimeoutRef.current = setTimeout(async () => {
                await fetchTrades();
                poll(); // Schedule next poll
            }, pollIntervalRef.current);
        };
        
        poll();

        // Cleanup
        return () => {
            if (pollTimeoutRef.current) {
                clearTimeout(pollTimeoutRef.current);
            }
        };
    }, [fetchTrades]);

    const formatDateTime = (isoString: string) => {
        return new Date(isoString).toLocaleString();
    };

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString();
    };

    if (loading && trades.length === 0) {
        return (
            <div className={styles.tradeList}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Recent Trades</h2>
                </div>
                <LoadingSkeleton />
            </div>
        );
    }

    return (
        <div className={styles.tradeList}>
            <div className={styles.header}>
                <h2 className={styles.title}>Recent Trades</h2>
                <div className={styles.status}>
                    {lastUpdated && (
                        <span>Last update: {lastUpdated.toLocaleTimeString()}</span>
                    )}
                    <div className={`${styles.indicator} ${error ? styles.indicatorError : styles.indicatorActive}`} />
                </div>
            </div>
            
            {/* Journal Modal */}
            {showJournalModal && selectedTrade && (
                <JournalModal
                    tradeId={selectedTrade.tradeId}
                    tradeDetails={{
                        isin: selectedTrade.isin,
                        quantity: selectedTrade.quantity,
                        price: selectedTrade.price,
                        side: selectedTrade.side || 'BUY',
                        tradeDate: selectedTrade.tradeDate,
                        settleDate: selectedTrade.settleDate
                    }}
                    onClose={() => setShowJournalModal(false)}
                />
            )}

            {error && <div className={styles.error}>{error}</div>}

            {trades.length === 0 ? (
                <div className={styles.emptyState}>No trades yet</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.tableHeader}>Time</th>
                                <th className={styles.tableHeader}>ISIN</th>
                                <th className={styles.tableHeader}>Quantity</th>
                                <th className={styles.tableHeader}>Price</th>
                                <th className={styles.tableHeader}>Trade Date</th>
                                <th className={styles.tableHeader}>Settle Date</th>
                                <th className={styles.tableHeader}>Journals</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trades.map(trade => (
                                <tr 
                                    key={trade.id}
                                    className={`${styles.tableRow} ${
                                        newTradeIds.has(trade.id) ? styles.newTrade : ''
                                    }`}
                                >
                                    <td className={styles.tableCell}>
                                        {formatDateTime(trade.createdAt)}
                                    </td>
                                    <td className={styles.tableCell} title={trade.isin}>
                                        {trade.isin}
                                    </td>
                                    <td className={styles.tableCell}>
                                        {trade.quantity.toLocaleString()}
                                    </td>
                                    <td className={styles.tableCell}>
                                        {trade.price.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </td>
                                    <td className={styles.tableCell}>
                                        {formatDate(trade.tradeDate)}
                                    </td>
                                    <td className={styles.tableCell}>
                                        {formatDate(trade.settleDate)}
                                    </td>
                                    <td className={styles.tableCell}>
                                        <JournalBadge 
                                            status={getJournalStatus(trade.id)}
                                            onClick={() => handleJournalClick(trade)} 
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
});

const LoadingSkeleton = () => (
    <div className={styles.loading}>
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                    {[...Array(6)].map((_, j) => (
                        <div
                            key={j}
                            className={styles.loadingCell}
                            style={{ width: j === 1 ? '120px' : '100px' }}
                        />
                    ))}
                </div>
            ))}
        </div>
    </div>
);

export default TradeList;
