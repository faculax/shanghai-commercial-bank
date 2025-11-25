import React from 'react';
import { TradeImport } from '../types/tradeImport';

interface ImportCardProps {
  tradeImport: TradeImport;
  onConsolidate: (id: number) => void;
  onGenerateMXML: (id: number) => void;
  onPushToMurex: (id: number) => void;
  onViewDetails: (id: number) => void;
  onDownloadMXML: (fileId: number, filename: string) => void;
}

export const ImportCard: React.FC<ImportCardProps> = ({
  tradeImport,
  onConsolidate,
  onGenerateMXML,
  onPushToMurex,
  onViewDetails,
  onDownloadMXML,
}) => {
  const getStatusBadge = (status: string) => {
    const badges = {
      IMPORTED: 'badge-pending',
      CONSOLIDATED: 'badge-confirmed',
      MXML_GENERATED: 'badge-confirmed',
      PUSHED_TO_MUREX: 'badge-settled',
    };
    return badges[status as keyof typeof badges] || 'badge-pending';
  };

  const getStatusText = (status: string) => {
    const texts = {
      IMPORTED: 'Imported',
      CONSOLIDATED: 'Consolidated',
      MXML_GENERATED: 'MXML Generated',
      PUSHED_TO_MUREX: 'Pushed to Murex',
    };
    return texts[status as keyof typeof texts] || status;
  };

  return (
    <div className="card">
      <div className="card-header flex justify-between items-center">
        <h3 className="text-lg font-semibold text-fd-text">{tradeImport.importName}</h3>
        <span className={`badge ${getStatusBadge(tradeImport.status)}`}>
          {getStatusText(tradeImport.status)}
        </span>
      </div>

      <div className="card-body">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-fd-text-muted text-sm">Original Trades</p>
            <p className="text-fd-text text-lg font-semibold">{tradeImport.originalTradeCount}</p>
          </div>
          <div>
            <p className="text-fd-text-muted text-sm">Current Trades</p>
            <p className="text-fd-text text-lg font-semibold">{tradeImport.currentTradeCount}</p>
          </div>
        </div>

        {tradeImport.consolidationCriteria && (
          <div className="mb-4">
            <p className="text-fd-text-muted text-sm">Consolidation Criteria</p>
            <p className="text-fd-text">{tradeImport.consolidationCriteria.replace('_', ' ')}</p>
          </div>
        )}

        {tradeImport.mxmlFiles && tradeImport.mxmlFiles.length > 0 && (
          <div className="mb-4">
            <p className="text-fd-text-muted text-sm mb-2">MXML Files ({tradeImport.mxmlFiles.length})</p>
            <div className="space-y-1">
              {tradeImport.mxmlFiles.map((file) => (
                <button
                  key={file.id}
                  onClick={() => onDownloadMXML(file.id, file.filename)}
                  className="text-fd-green text-sm hover:underline block"
                >
                  📄 {file.filename}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onViewDetails(tradeImport.id)}
            className="btn btn-outline text-xs"
          >
            View Details
          </button>

          {tradeImport.status === 'IMPORTED' && (
            <button
              onClick={() => onConsolidate(tradeImport.id)}
              className="btn btn-primary text-xs"
            >
              Consolidate
            </button>
          )}

          {tradeImport.status === 'CONSOLIDATED' && !tradeImport.mxmlGenerated && (
            <button
              onClick={() => onGenerateMXML(tradeImport.id)}
              className="btn btn-primary text-xs"
            >
              Generate MXML
            </button>
          )}

          {tradeImport.status === 'MXML_GENERATED' && !tradeImport.pushedToMurex && (
            <button
              onClick={() => onPushToMurex(tradeImport.id)}
              className="btn btn-primary text-xs"
            >
              Push to Murex
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
