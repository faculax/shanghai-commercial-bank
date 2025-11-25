import React, { useState } from 'react';

interface ConsolidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (criteria: 'CURRENCY_PAIR' | 'COUNTERPARTY' | 'BOOK' | 'CURRENCY_PAIR_AND_COUNTERPARTY' | 'CURRENCY_PAIR_AND_BOOK' | 'COUNTERPARTY_AND_BOOK' | 'ALL_CRITERIA') => void;
  isLoading: boolean;
}

export const ConsolidationModal: React.FC<ConsolidationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [selectedCriteria, setSelectedCriteria] = useState({
    currencyPair: true,
    counterparty: false,
    book: false
  });

  if (!isOpen) return null;

  const handleToggle = (criterion: keyof typeof selectedCriteria) => {
    setSelectedCriteria(prev => ({
      ...prev,
      [criterion]: !prev[criterion]
    }));
  };

  const getCombinedCriteria = () => {
    const { currencyPair, counterparty, book } = selectedCriteria;
    
    if (currencyPair && counterparty && book) {
      return 'ALL_CRITERIA';
    } else if (currencyPair && counterparty) {
      return 'CURRENCY_PAIR_AND_COUNTERPARTY';
    } else if (currencyPair && book) {
      return 'CURRENCY_PAIR_AND_BOOK';
    } else if (counterparty && book) {
      return 'COUNTERPARTY_AND_BOOK';
    } else if (currencyPair) {
      return 'CURRENCY_PAIR';
    } else if (counterparty) {
      return 'COUNTERPARTY';
    } else if (book) {
      return 'BOOK';
    }
    
    return 'CURRENCY_PAIR'; // fallback
  };

  const isAtLeastOneSelected = () => {
    return selectedCriteria.currencyPair || selectedCriteria.counterparty || selectedCriteria.book;
  };

  const handleConfirm = () => {
    if (isAtLeastOneSelected()) {
      onConfirm(getCombinedCriteria() as any);
    }
  };

  const getPreviewText = () => {
    const selected = [];
    if (selectedCriteria.currencyPair) selected.push('Currency Pair');
    if (selectedCriteria.counterparty) selected.push('Counterparty');
    if (selectedCriteria.book) selected.push('Book');
    
    if (selected.length === 0) return 'No criteria selected';
    if (selected.length === 1) return `Group by ${selected[0]}`;
    if (selected.length === 2) return `Group by ${selected[0]} and ${selected[1]}`;
    return `Group by ${selected[0]}, ${selected[1]}, and ${selected[2]}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-fd-darker border border-fd-border rounded-lg shadow-fd p-6 max-w-lg w-full">
        <h2 className="text-xl font-semibold text-fd-text mb-4">Consolidate Trades</h2>
        
        <p className="text-fd-text-muted text-sm mb-6">
          Select the criteria to consolidate trades. Trades matching all selected criteria will be merged into net positions.
        </p>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-fd-text font-medium">Currency Pair</span>
              <span className="text-fd-text-muted text-xs">Group trades by currency pair (e.g., EUR/USD)</span>
            </div>
            <button
              onClick={() => handleToggle('currencyPair')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                selectedCriteria.currencyPair ? 'bg-fd-green' : 'bg-fd-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  selectedCriteria.currencyPair ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-fd-text font-medium">Counterparty</span>
              <span className="text-fd-text-muted text-xs">Group trades by counterparty (e.g., Goldman Sachs)</span>
            </div>
            <button
              onClick={() => handleToggle('counterparty')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                selectedCriteria.counterparty ? 'bg-fd-green' : 'bg-fd-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  selectedCriteria.counterparty ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-fd-text font-medium">Book</span>
              <span className="text-fd-text-muted text-xs">Group trades by trading book (e.g., FX_SPOT_DESK)</span>
            </div>
            <button
              onClick={() => handleToggle('book')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                selectedCriteria.book ? 'bg-fd-green' : 'bg-fd-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  selectedCriteria.book ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-fd-dark rounded-lg p-3 mb-6">
          <div className="text-fd-text-muted text-xs uppercase tracking-wider mb-1">Preview</div>
          <div className={`text-sm ${isAtLeastOneSelected() ? 'text-fd-text' : 'text-red-400'}`}>
            {getPreviewText()}
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="btn btn-outline flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !isAtLeastOneSelected()}
            className="btn btn-primary flex-1"
          >
            {isLoading ? 'Consolidating...' : 'Consolidate'}
          </button>
        </div>
      </div>
    </div>
  );
};
