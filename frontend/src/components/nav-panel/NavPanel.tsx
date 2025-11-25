import React, { useState, useEffect, forwardRef, useImperativeHandle, ForwardedRef } from 'react';
import { navService } from '../../services/navService';
import { NavSnapshot } from '../../types/nav';
import styles from './NavPanel.module.css';

/**
 * Ref type definition for NavPanel component
 * This allows parent components to call refreshData() via a ref
 */
export interface NavPanelRef {
  refreshData: () => void;
}

/**
 * NavPanel - minimal UI surface for Epic_05 (NAV)
 *
 * - Shows latest NAV snapshot (if any)
 * - "Calculate NAV" button to trigger backend calculation (POST /api/nav/calculate)
 * - Small history list (newest-first) to observe recent snapshots
 *
 * Design constraints:
 * - Small footprint; placed in right column alongside Positions/Cash
 * - Reuse existing app look & feel (tailwind classes where helpful)
 * - Keep behavior predictable: button disabled while running
 */
const NavPanel = forwardRef<NavPanelRef, {}>((props, ref: ForwardedRef<NavPanelRef>) => {
  const [latest, setLatest] = useState<NavSnapshot | null>(null);
  const [history, setHistory] = useState<NavSnapshot[]>([]);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [runningCalc, setRunningCalc] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expose refreshData to parent components via ref
  useImperativeHandle(ref, () => ({
    refreshData: () => {
      refreshLatest();
      refreshHistory();
    }
  }));

  const refreshLatest = async () => {
    setLoadingLatest(true);
    setError(null);
    try {
      const data = await navService.getLatest();
      setLatest(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingLatest(false);
    }
  };

  const refreshHistory = async () => {
    setError(null);
    try {
      const h = await navService.getHistory('DEFAULT', 10);
      setHistory(h);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    // initial load
    refreshLatest();
    refreshHistory();
  }, []);

  const handleCalculate = async () => {
    setRunningCalc(true);
    setError(null);
    try {
      const snapshot = await navService.calculate('DEFAULT');
      // update UI with returned persisted snapshot
      setLatest(snapshot);
      // prepend to history (keep short)
      setHistory(prev => [snapshot, ...prev].slice(0, 10));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunningCalc(false);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3>NAV</h3>
        <div>
          <button
            className="bg-transparent border border-fd-border px-3 py-1 rounded mr-2 text-sm text-fd-text hover:bg-fd-dark"
            onClick={refreshLatest}
            disabled={loadingLatest || runningCalc}
          >
            <span className="mr-1">↻</span> Refresh
          </button>
          <button
            className="bg-fd-green text-black px-3 py-1 rounded text-sm hover:bg-opacity-90"
            onClick={handleCalculate}
            disabled={runningCalc}
          >
            {runningCalc ? 'Calculating...' : 'Calculate NAV'}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        <div className={styles.latest}>
          <div className={styles.row}>
            <span className={styles.label}>Calculation:</span>
            <span className={styles.value}>
              {latest ? formatDate(latest.calculationDate) : (loadingLatest ? 'Loading...' : '—')}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Gross:</span>
            <span className={styles.value}>{latest ? formatCurrency(latest.grossValue) : '—'}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Fee (daily):</span>
            <span className={styles.value}>{latest ? formatCurrency(latest.feeAccrual) : '—'}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Net:</span>
            <span className={styles.value}>{latest ? formatCurrency(latest.netValue) : '—'}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>NAV / share:</span>
            <span className={styles.value}>{latest ? latest.navPerShare.toFixed(4) : '—'}</span>
          </div>
        </div>

        {/* Recent snapshots section */}
        <div className={styles.history}>
          <h4>Recent snapshots</h4>
          {history.length === 0 ? (
            <div className={styles.empty}>No snapshots</div>
          ) : (
            <ul className={styles.list}>
              {history.map(h => (
                <li key={h.id} className={styles.listItem}>
                  {/* Put date and value on same line with flex layout */}
                  <span className={styles.histDate}>{formatDate(h.calculationDate)}</span>
                  <span className={styles.histValue}>{formatCurrency(h.netValue)} ({h.navPerShare.toFixed(4)})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
});

/** Small formatter matching UI conventions (USD) */
function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

// Add this helper function to fix the date formatting issue
function formatDate(dateString: string): string {
  if (!dateString) return '—';
  
  // Remove timezone ID in brackets if present
  const cleanDate = dateString.split('[')[0];
  
  try {
    const date = new Date(cleanDate);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString();
  } catch (e) {
    return 'Invalid Date';
  }
}

export default NavPanel;