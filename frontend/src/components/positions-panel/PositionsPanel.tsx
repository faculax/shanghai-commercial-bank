import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Position, positionService } from '../../services/positionService';
import { CashBalance, cashService } from '../../services/cashService';
import styles from './PositionsPanel.module.css';

const POLL_INTERVAL_MS = 2000; // Update more frequently to catch trade updates

export interface PositionsPanelRef {
    refreshData: () => Promise<void>;
}

export interface PositionsPanelProps {
    portfolioId?: string;
}

export const PositionsPanel = forwardRef<PositionsPanelRef, PositionsPanelProps>((props, ref) => {
    const { portfolioId = 'DEFAULT' } = props;
    
    const [positions, setPositions] = useState<Position[]>([]);
    const [cashBalance, setCashBalance] = useState<CashBalance | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [positionsData, cashData] = await Promise.all([
                positionService.fetchPositions({ portfolioId }),
                cashService.fetchCashBalance({ portfolioId })
            ]);
            
            setPositions(positionsData);
            setCashBalance(cashData);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load positions and cash data. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [portfolioId]);

    useImperativeHandle(ref, () => ({
        refreshData: fetchData
    }));

    useEffect(() => {
        fetchData();
        
        const interval = setInterval(fetchData, POLL_INTERVAL_MS);
        
        return () => {
            clearInterval(interval);
        };
    }, [fetchData]);

    const handleRefreshClick = () => {
        fetchData();
    };

    if (loading && !positions.length) {
        return <div className={styles['positions-container']}>Loading positions and cash data...</div>;
    }

    if (error) {
        return <div className={styles['positions-container']}>{error}</div>;
    }

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US').format(num);
    };

    const formatDateTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return 'Invalid Date';
        }
    };

    return (
        <div className={styles['positions-container']}>
            <div className={styles['positions-header']}>
                <h3>Portfolio Positions</h3>
                <button className={styles['refresh-button']} onClick={handleRefreshClick}>
                    <span className={styles['refresh-icon']}>↻</span> Refresh
                </button>
            </div>
            
            {lastUpdated && (
                <div className={styles['last-updated']}>
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
            )}
            
            <h4 className={styles['section-title']}>Cash Balance</h4>
            {cashBalance ? (
                <div className={cashBalance.balance < 0 ? styles['negative'] : styles['positive']}>
                    {formatCurrency(cashBalance.balance, cashBalance.currency)}
                </div>
            ) : (
                <div className={styles['empty-message']}>No cash data available</div>
            )}
            
            <h4>Securities</h4>
            {positions.length > 0 ? (
                <table className={styles['positions-table']}>
                    <thead>
                        <tr>
                            <th>ISIN</th>
                            <th>Quantity</th>
                            <th>Updated At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {positions.map((position) => (
                            <tr key={position.isin}>
                                <td>{position.isin}</td>
                                <td>{formatNumber(position.quantity)}</td>
                                <td>{formatDateTime(position.lastUpdated)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className={styles['empty-message']}>No positions available</div>
            )}
        </div>
    );
});

export default PositionsPanel;