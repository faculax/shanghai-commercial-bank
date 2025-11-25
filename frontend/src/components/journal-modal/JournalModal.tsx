import React, { useState, useEffect } from 'react';
import { Journal, JournalLine, journalService } from '../../services/journalService';
import styles from './JournalModal.module.css';

interface JournalModalProps {
  tradeId: string;
  tradeDetails: {
    isin: string;
    quantity: number;
    price: number;
    side: string;
    tradeDate: string;
    settleDate: string;
  };
  onClose: () => void;
}

const JournalModal: React.FC<JournalModalProps> = ({ tradeId, tradeDetails, onClose }) => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await journalService.fetchJournals({ tradeId });
        setJournals(data);
      } catch (err) {
        console.error('Error fetching journals:', err);
        setError('Failed to load journals. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchJournals();
  }, [tradeId]);

  // Group journals by type
  const tradeDateJournal = journals.find(journal => journal.type === 'TRADE_DATE');
  const settlementDateJournal = journals.find(journal => journal.type === 'SETTLEMENT_DATE');

  // Format utility functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString() + ' ' + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Handle modal close
  const handleClose = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent scrolling on the body when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className={styles['journal-modal-overlay']} onClick={handleClose}>
      <div className={styles['journal-modal-container']}>
        <div className={styles['journal-modal-header']}>
          <h2>Trade Journals</h2>
          <button 
            className={styles['journal-modal-close-button']} 
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        <div className={styles['journal-modal-content']}>
          {/* Trade Details */}
          <div className={styles['journal-trade-details']}>
            <div className={styles['journal-details-grid']}>
              <div className={styles['journal-detail-item']}>
                <span className={styles['journal-detail-label']}>Trade ID</span>
                <span className={styles['journal-detail-value']}>
                  {typeof tradeId === 'string' && tradeId ? `${tradeId.substring(0, 8)}...` : tradeId}
                </span>
              </div>
              <div className={styles['journal-detail-item']}>
                <span className={styles['journal-detail-label']}>ISIN</span>
                <span className={styles['journal-detail-value']}>{tradeDetails.isin}</span>
              </div>
              <div className={styles['journal-detail-item']}>
                <span className={styles['journal-detail-label']}>Side</span>
                <span className={styles['journal-detail-value']}>{tradeDetails.side}</span>
              </div>
              <div className={styles['journal-detail-item']}>
                <span className={styles['journal-detail-label']}>Quantity</span>
                <span className={styles['journal-detail-value']}>
                  {new Intl.NumberFormat().format(tradeDetails.quantity)}
                </span>
              </div>
              <div className={styles['journal-detail-item']}>
                <span className={styles['journal-detail-label']}>Price</span>
                <span className={styles['journal-detail-value']}>
                  {formatCurrency(tradeDetails.price)}
                </span>
              </div>
              <div className={styles['journal-detail-item']}>
                <span className={styles['journal-detail-label']}>Amount</span>
                <span className={styles['journal-detail-value']}>
                  {formatCurrency(tradeDetails.quantity * tradeDetails.price)}
                </span>
              </div>
              <div className={styles['journal-detail-item']}>
                <span className={styles['journal-detail-label']}>Trade Date</span>
                <span className={styles['journal-detail-value']}>
                  {formatDateTime(tradeDetails.tradeDate)}
                </span>
              </div>
              <div className={styles['journal-detail-item']}>
                <span className={styles['journal-detail-label']}>Settle Date</span>
                <span className={styles['journal-detail-value']}>
                  {formatDateTime(tradeDetails.settleDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Journals */}
          {loading ? (
            <div className={styles['loading-indicator']}>Loading journals...</div>
          ) : error ? (
            <div className={styles['error-message']}>{error}</div>
          ) : journals.length === 0 ? (
            <div className={styles['empty-message']}>No journals found for this trade.</div>
          ) : (
            <div className={styles['journal-groups']}>
              {/* Trade Date Journal */}
              {tradeDateJournal && (
                <div className={styles['journal-group']}>
                  <div className={styles['journal-group-header']}>
                    <h3 className={styles['journal-group-title']}>TRADE DATE JOURNAL</h3>
                    <span className={styles['journal-group-meta']}>
                      {formatDateTime(tradeDateJournal.createdAt)}
                    </span>
                  </div>
                  <table className={styles['journal-table']}>
                    <thead>
                      <tr>
                        <th>Account</th>
                        <th className={styles['journal-table-amount']}>Debit</th>
                        <th className={styles['journal-table-amount']}>Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradeDateJournal.lines.map((line: JournalLine, idx: number) => (
                        <tr key={idx}>
                          <td>{line.account}</td>
                          <td className={styles['journal-table-amount']}>
                            {line.debit > 0 ? formatCurrency(line.debit) : ''}
                          </td>
                          <td className={styles['journal-table-amount']}>
                            {line.credit > 0 ? formatCurrency(line.credit) : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className={styles['journal-table-footer']}>
                        <td className={styles['journal-table-totals']}>TOTAL</td>
                        <td className={`${styles['journal-table-amount']} ${styles['journal-table-totals']}`}>
                          {formatCurrency(tradeDateJournal.totalDebits)}
                        </td>
                        <td className={`${styles['journal-table-amount']} ${styles['journal-table-totals']}`}>
                          {formatCurrency(tradeDateJournal.totalCredits)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Settlement Date Journal */}
              {settlementDateJournal && (
                <div className={styles['journal-group']}>
                  <div className={styles['journal-group-header']}>
                    <h3 className={styles['journal-group-title']}>SETTLEMENT DATE JOURNAL</h3>
                    <span className={styles['journal-group-meta']}>
                      {formatDateTime(settlementDateJournal.createdAt)}
                    </span>
                  </div>
                  <table className={styles['journal-table']}>
                    <thead>
                      <tr>
                        <th>Account</th>
                        <th className={styles['journal-table-amount']}>Debit</th>
                        <th className={styles['journal-table-amount']}>Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settlementDateJournal.lines.map((line: JournalLine, idx: number) => (
                        <tr key={idx}>
                          <td>{line.account}</td>
                          <td className={styles['journal-table-amount']}>
                            {line.debit > 0 ? formatCurrency(line.debit) : ''}
                          </td>
                          <td className={styles['journal-table-amount']}>
                            {line.credit > 0 ? formatCurrency(line.credit) : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className={styles['journal-table-footer']}>
                        <td className={styles['journal-table-totals']}>TOTAL</td>
                        <td className={`${styles['journal-table-amount']} ${styles['journal-table-totals']}`}>
                          {formatCurrency(settlementDateJournal.totalDebits)}
                        </td>
                        <td className={`${styles['journal-table-amount']} ${styles['journal-table-totals']}`}>
                          {formatCurrency(settlementDateJournal.totalCredits)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalModal;
