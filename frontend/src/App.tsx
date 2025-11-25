import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import TopBar from './components/top-bar/TopBar';
import { ConsolidationModal } from './components/ConsolidationModal';
import { ImportDetailsModal } from './components/ImportDetailsModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Toast } from './components/Toast';
import { tradeImportService } from './services/tradeImportService';
import { TradeImport } from './types/tradeImport';

function App() {
  const [imports, setImports] = useState<TradeImport[]>([]);
  const [selectedImport, setSelectedImport] = useState<TradeImport | null>(null);
  const [isConsolidationModalOpen, setIsConsolidationModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [importIdToConsolidate, setImportIdToConsolidate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'imports' | 'consolidated' | 'mxml' | 'murex'>('imports');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [importToDelete, setImportToDelete] = useState<number | null>(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadImports();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setIsToastVisible(true);
  };

  const loadImports = async () => {
    try {
      const data = await tradeImportService.getAllImports();
      setImports(data);
    } catch (error) {
      console.error('Failed to load imports:', error);
      showToast('Failed to load imports', 'error');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await tradeImportService.uploadCsv(file);
      await loadImports();
      showToast('CSV imported successfully', 'success');
    } catch (error) {
      console.error('Failed to upload CSV:', error);
      showToast('Failed to upload CSV', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConsolidate = (id: number) => {
    setImportIdToConsolidate(id);
    setIsConsolidationModalOpen(true);
  };

  const handleConsolidationConfirm = async (criteria: 'CURRENCY_PAIR' | 'COUNTERPARTY' | 'BOOK' | 'CURRENCY_PAIR_AND_COUNTERPARTY' | 'CURRENCY_PAIR_AND_BOOK' | 'COUNTERPARTY_AND_BOOK' | 'ALL_CRITERIA') => {
    if (!importIdToConsolidate) return;

    setIsLoading(true);
    try {
      await tradeImportService.consolidate(importIdToConsolidate, { criteria });
      await loadImports();
      setIsConsolidationModalOpen(false);
      setImportIdToConsolidate(null);
      showToast('Import consolidated successfully', 'success');
    } catch (error) {
      console.error('Failed to consolidate:', error);
      showToast('Failed to consolidate import', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMXML = async (id: number) => {
    try {
      await tradeImportService.generateMXML(id);
      await loadImports();
      showToast('MXML files generated successfully', 'success');
    } catch (error) {
      console.error('Failed to generate MXML:', error);
      showToast('Failed to generate MXML', 'error');
    }
  };

  const handlePushToMurex = async (id: number) => {
    try {
      await tradeImportService.pushToMurex(id);
      await loadImports();
      showToast('Successfully pushed to Murex', 'success');
    } catch (error) {
      console.error('Failed to push to Murex:', error);
      showToast('Failed to push to Murex', 'error');
    }
  };

  const handleClearAllImports = () => {
    setIsConfirmationModalOpen(true);
  };

  const handleConfirmClearAllImports = async () => {
    setIsConfirmationModalOpen(false);
    setIsClearing(true);
    try {
      await tradeImportService.clearAllImports();
      await loadImports();
      showToast('All imports cleared successfully', 'success');
    } catch (error) {
      console.error('Failed to clear all imports:', error);
      showToast('Failed to clear all imports', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteImport = (id: number) => {
    setImportToDelete(id);
    setIsDeleteConfirmationOpen(true);
  };

  const handleConfirmDeleteImport = async () => {
    if (!importToDelete) return;
    
    setIsDeleteConfirmationOpen(false);
    setIsLoading(true);
    try {
      await tradeImportService.deleteImport(importToDelete);
      await loadImports();
      showToast('Import deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete import:', error);
      showToast('Failed to delete import', 'error');
    } finally {
      setIsLoading(false);
      setImportToDelete(null);
    }
  };

  const formatConsolidationCriteria = (criteria?: string) => {
    if (!criteria) return null;
    
    const formatMap: Record<string, string> = {
      'CURRENCY_PAIR': 'Currency Pair',
      'COUNTERPARTY': 'Counterparty',
      'BOOK': 'Book',
      'CURRENCY_PAIR_AND_COUNTERPARTY': 'Currency Pair + Counterparty',
      'CURRENCY_PAIR_AND_BOOK': 'Currency Pair + Book',
      'COUNTERPARTY_AND_BOOK': 'Counterparty + Book',
      'ALL_CRITERIA': 'All Criteria'
    };
    
    return formatMap[criteria] || criteria.replace(/_/g, ' ');
  };

  const handleDownloadAllMXML = async (importId: number, importName: string) => {
    try {
      const blob = await tradeImportService.downloadAllMXMLFiles(importId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${importName}-mxml-files.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('MXML files downloaded successfully', 'success');
    } catch (error) {
      console.error('Failed to download MXML files:', error);
      showToast('Failed to download MXML files', 'error');
    }
  };

  const handleViewDetails = async (id: number) => {
    try {
      const importData = await tradeImportService.getImportById(id);
      setSelectedImport(importData);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('Failed to load import details:', error);
      showToast('Failed to load import details', 'error');
    }
  };

  const handleDownloadMXML = async (fileId: number, filename: string) => {
    try {
      const blob = await tradeImportService.downloadMXMLFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download MXML:', error);
      showToast('Failed to download MXML file', 'error');
    }
  };

  const getFilteredImports = () => {
    switch (activeTab) {
      case 'imports':
        return imports.filter(imp => imp.status === 'IMPORTED');
      case 'consolidated':
        return imports.filter(imp => imp.status === 'CONSOLIDATED');
      case 'mxml':
        return imports.filter(imp => imp.status === 'MXML_GENERATED');
      case 'murex':
        return imports.filter(imp => imp.status === 'PUSHED_TO_MUREX');
      default:
        return [];
    }
  };

  const renderImportsTable = () => {
    const filteredImports = getFilteredImports();
    
    return (
      <div>
        {/* Import controls - only show in imports tab */}
        {activeTab === 'imports' && (
          <div className="mb-6 flex justify-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="btn btn-primary"
              >
                {isUploading ? 'Uploading...' : '+ Import CSV'}
              </button>
            </label>
            <button
              onClick={handleClearAllImports}
              disabled={isClearing || imports.length === 0}
              className="btn btn-outline"
            >
              {isClearing ? 'Clearing...' : 'Clear All Imports'}
            </button>
          </div>
        )}
        
        {filteredImports.length === 0 ? (
          <div className="text-center text-fd-text-muted py-16">
            <p className="text-lg">No imports in this status</p>
          </div>
        ) : (
          <div className="bg-fd-darker rounded-lg border border-fd-border">
            {renderImportsTableContent(filteredImports)}
          </div>
        )}
      </div>
    );
  };

  const renderImportsTableContent = (filteredImports: TradeImport[]) => {

    return (
      <table className="table">
        <thead className="table-header">
          <tr>
            <th>Import Name</th>
            <th>Original Trades</th>
            <th>Current Trades</th>
            <th>Consolidation Criteria</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody className="table-body">
          {filteredImports.map((importItem) => (
            <tr key={importItem.id}>
              <td className="font-medium">{importItem.importName}</td>
              <td>{importItem.originalTradeCount}</td>
              <td>{importItem.currentTradeCount}</td>
              <td>{formatConsolidationCriteria(importItem.consolidationCriteria) || '-'}</td>
              <td>{new Date(importItem.createdAt).toLocaleDateString()}</td>
              <td>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetails(importItem.id)}
                    className="btn btn-outline text-xs"
                  >
                    View Details
                  </button>
                  
                  {activeTab === 'imports' && (
                    <button
                      onClick={() => handleConsolidate(importItem.id)}
                      className="btn btn-primary text-xs"
                    >
                      Consolidate
                    </button>
                  )}

                  {activeTab === 'consolidated' && (
                    <>
                      <button
                        onClick={() => handleGenerateMXML(importItem.id)}
                        className="btn btn-primary text-xs"
                      >
                        Generate MXML
                      </button>
                      <button
                        onClick={() => handleDeleteImport(importItem.id)}
                        className="btn btn-outline text-xs text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                      >
                        Delete
                      </button>
                    </>
                  )}

                    {activeTab === 'mxml' && (
                      <>
                        <button
                          onClick={() => handlePushToMurex(importItem.id)}
                          className="btn btn-primary text-xs"
                        >
                          Push to Murex
                        </button>
                        {importItem.mxmlFiles && importItem.mxmlFiles.length > 0 && (
                          <button
                            onClick={() => handleDownloadAllMXML(importItem.id, importItem.importName)}
                            className="btn btn-outline text-xs"
                            title={`Download all MXML files (${importItem.mxmlFiles.length} files)`}
                          >
                            Download All
                          </button>
                        )}
                      </>
                    )}

                    {activeTab === 'murex' && importItem.mxmlFiles && importItem.mxmlFiles.length > 0 && (
                      <button
                        onClick={() => handleDownloadAllMXML(importItem.id, importItem.importName)}
                        className="btn btn-outline text-xs"
                        title={`Download all MXML files (${importItem.mxmlFiles.length} files)`}
                      >
                        Download All
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
    );
  };

  return (
    <div className="min-h-screen bg-fd-dark">
      <TopBar />
      
      <div className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-fd-text mb-4">
            <span className="text-fd-text">SHANGHAI </span>
            <span className="text-fd-green">COMMERCIAL BANK</span>
          </h1>
          <p className="text-fd-text-muted">Trade Import & Processing System</p>
        </div>
        
        <div className="container-constrained">
          {/* Tabs Navigation */}
          <div className="nav-tabs mb-6">
            <button
              className={`nav-tab ${activeTab === 'imports' ? 'active' : 'inactive'}`}
              onClick={() => setActiveTab('imports')}
            >
              Imports ({imports.filter(imp => imp.status === 'IMPORTED').length})
            </button>
            <button
              className={`nav-tab ${activeTab === 'consolidated' ? 'active' : 'inactive'}`}
              onClick={() => setActiveTab('consolidated')}
            >
              Consolidated ({imports.filter(imp => imp.status === 'CONSOLIDATED').length})
            </button>
            <button
              className={`nav-tab ${activeTab === 'mxml' ? 'active' : 'inactive'}`}
              onClick={() => setActiveTab('mxml')}
            >
              MXML Generated ({imports.filter(imp => imp.status === 'MXML_GENERATED').length})
            </button>
            <button
              className={`nav-tab ${activeTab === 'murex' ? 'active' : 'inactive'}`}
              onClick={() => setActiveTab('murex')}
            >
              Pushed to Murex ({imports.filter(imp => imp.status === 'PUSHED_TO_MUREX').length})
            </button>
          </div>

          {/* Table Content */}
          {renderImportsTable()}
        </div>
      </div>

      <ConsolidationModal
        isOpen={isConsolidationModalOpen}
        onClose={() => {
          setIsConsolidationModalOpen(false);
          setImportIdToConsolidate(null);
        }}
        onConfirm={handleConsolidationConfirm}
        isLoading={isLoading}
      />

      <ImportDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedImport(null);
        }}
        tradeImport={selectedImport}
      />

      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        title="Clear All Imports"
        message="Are you sure you want to clear all imports? This action cannot be undone and will remove all import data from the system."
        confirmText="Clear All"
        cancelText="Cancel"
        onConfirm={handleConfirmClearAllImports}
        onCancel={() => setIsConfirmationModalOpen(false)}
        isLoading={isClearing}
      />

      <ConfirmationModal
        isOpen={isDeleteConfirmationOpen}
        title="Delete Import"
        message="Are you sure you want to delete this import? This action cannot be undone and will remove all associated trades and MXML files."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteImport}
        onCancel={() => {
          setIsDeleteConfirmationOpen(false);
          setImportToDelete(null);
        }}
        isLoading={isLoading}
      />

      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={isToastVisible}
        onClose={() => setIsToastVisible(false)}
      />
    </div>
  );
}

export default App;
