import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import TopBar from './components/top-bar/TopBar';
import { ConsolidationModal } from './components/ConsolidationModal';
import { ImportDetailsModal } from './components/ImportDetailsModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Toast } from './components/Toast';
import { LiveTradesGrid } from './components/LiveTradesGrid';
import { Dashboard } from './components/Dashboard';
import { DemoConfig } from './types/liveTrade';
import { liveTradeService } from './services/liveTradeService';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'imports' | 'consolidated' | 'mxml' | 'murex'>('dashboard');
  const [importsSubTab, setImportsSubTab] = useState<'csv' | 'live'>('live');
  const [pendingTradeCount, setPendingTradeCount] = useState(0);
  const [liveTradeRefreshTrigger, setLiveTradeRefreshTrigger] = useState(0);
  const [newImportIds, setNewImportIds] = useState<Set<number>>(new Set());
  const [newMxmlImportIds, setNewMxmlImportIds] = useState<Set<number>>(new Set());
  const [newMurexImportIds, setNewMurexImportIds] = useState<Set<number>>(new Set());
  const [previousConsolidatedIds, setPreviousConsolidatedIds] = useState<Set<number>>(new Set());
  const [previousMxmlIds, setPreviousMxmlIds] = useState<Set<number>>(new Set());
  const [previousMurexIds, setPreviousMurexIds] = useState<Set<number>>(new Set());
  const [demoConfig, setDemoConfig] = useState<DemoConfig>({
    enabled: false,
    tradesPerSecond: 2.0,
    groupingIntervalSeconds: 10,
    autoMxmlEnabled: false,
    mxmlGenerationIntervalSeconds: 20,
    autoMurexEnabled: false,
    murexPushIntervalSeconds: 30,
  });
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [importToDelete, setImportToDelete] = useState<number | null>(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [isBulkClearConfirmationOpen, setIsBulkClearConfirmationOpen] = useState(false);
  const [isBulkGenerateConfirmationOpen, setIsBulkGenerateConfirmationOpen] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadImports();
    loadDemoConfig();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDemoConfig = async () => {
    try {
      const config = await liveTradeService.getDemoConfig();
      setDemoConfig(config);
    } catch (error) {
      console.error('Failed to load demo config:', error);
    }
  };

  // Poll for pending trade count
  useEffect(() => {
    if (activeTab === 'imports' && importsSubTab === 'live') {
      const interval = setInterval(async () => {
        try {
          const count = await liveTradeService.getPendingTradeCount();
          setPendingTradeCount(count);
        } catch (error) {
          console.error('Failed to get pending trade count:', error);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeTab, importsSubTab]);

  // Auto-refresh consolidated tab every 3 seconds when active
  useEffect(() => {
    if (activeTab === 'consolidated') {
      const interval = setInterval(() => {
        loadImports();
        // This will trigger the effect below to detect new imports
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh MXML tab every 3 seconds when active
  useEffect(() => {
    if (activeTab === 'mxml') {
      const interval = setInterval(() => {
        loadImports();
        // This will trigger the effect below to detect new MXML imports
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh Murex tab every 3 seconds when active
  useEffect(() => {
    if (activeTab === 'murex') {
      const interval = setInterval(() => {
        loadImports();
        // This will trigger the effect below to detect new Murex imports
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Detect new consolidated imports and add flash effect
  useEffect(() => {
    const consolidatedImports = imports.filter(imp => imp.status === 'CONSOLIDATED');
    const currentIds = new Set(consolidatedImports.map(imp => imp.id));
    
    // Find genuinely new imports (ones that weren't in the previous set)
    const newIds = new Set([...currentIds].filter(id => !previousConsolidatedIds.has(id)));
    
    if (newIds.size > 0 && previousConsolidatedIds.size > 0) { // Don't trigger on initial load
      // Check if these are truly new (created recently)
      const recentNewIds = new Set([...newIds].filter(id => {
        const importItem = consolidatedImports.find(imp => imp.id === id);
        if (importItem) {
          const importDate = new Date(importItem.createdAt);
          const now = new Date();
          // Consider it new if created within the last 30 seconds
          return (now.getTime() - importDate.getTime()) < 30000;
        }
        return false;
      }));
      
      if (recentNewIds.size > 0) {
        setNewImportIds(recentNewIds);
        
        // Show different messages for automatic vs manual processing
        const isAutomatic = [...recentNewIds].some(id => {
          const importItem = consolidatedImports.find(imp => imp.id === id);
          return importItem?.importName.startsWith('LIVE-');
        });
        
        const message = isAutomatic 
          ? `🎯 ${recentNewIds.size} new consolidated import${recentNewIds.size > 1 ? 's' : ''} from automatic grouping!`
          : `${recentNewIds.size} new consolidated import${recentNewIds.size > 1 ? 's' : ''} received!`;
          
        showToast(message, 'success');
        
        // Remove flash effect after 4 seconds for auto-generated imports
        setTimeout(() => {
          setNewImportIds(new Set());
        }, 4000);
      }
    }
    
    // Update the tracking sets
    setPreviousConsolidatedIds(currentIds);
  }, [imports, previousConsolidatedIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Detect new MXML imports and add flash effect
  useEffect(() => {
    const mxmlImports = imports.filter(imp => imp.status === 'MXML_GENERATED');
    const currentMxmlIds = new Set(mxmlImports.map(imp => imp.id));
    
    // Find genuinely new MXML imports
    const newMxmlIds = new Set([...currentMxmlIds].filter(id => !previousMxmlIds.has(id)));
    
    if (newMxmlIds.size > 0 && previousMxmlIds.size > 0) { // Don't trigger on initial load
      // Check if these are truly new (created recently)
      const recentNewMxmlIds = new Set([...newMxmlIds].filter(id => {
        const importItem = mxmlImports.find(imp => imp.id === id);
        if (importItem) {
          const importDate = new Date(importItem.createdAt);
          const now = new Date();
          // Consider it new if created within the last 30 seconds
          return (now.getTime() - importDate.getTime()) < 30000;
        }
        return false;
      }));
      
      if (recentNewMxmlIds.size > 0) {
        setNewMxmlImportIds(recentNewMxmlIds);
        
        // Show message for new MXML generation
        const message = `⚡ ${recentNewMxmlIds.size} new MXML file${recentNewMxmlIds.size > 1 ? 's' : ''} generated!`;
        showToast(message, 'success');
        
        // Remove flash effect after 4 seconds
        setTimeout(() => {
          setNewMxmlImportIds(new Set());
        }, 4000);
      }
    }
    
    // Update the tracking sets
    setPreviousMxmlIds(currentMxmlIds);
  }, [imports, previousMxmlIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Detect new Murex imports and add flash effect
  useEffect(() => {
    const murexImports = imports.filter(imp => imp.status === 'PUSHED_TO_MUREX');
    const currentMurexIds = new Set(murexImports.map(imp => imp.id));
    
    // Find genuinely new Murex imports
    const newMurexIds = new Set([...currentMurexIds].filter(id => !previousMurexIds.has(id)));
    
    if (newMurexIds.size > 0 && previousMurexIds.size > 0) { // Don't trigger on initial load
      // Check if these are truly new (created recently)
      const recentNewMurexIds = new Set([...newMurexIds].filter(id => {
        const importItem = murexImports.find(imp => imp.id === id);
        if (importItem) {
          const importDate = new Date(importItem.createdAt);
          const now = new Date();
          // Consider it new if created within the last 30 seconds
          return (now.getTime() - importDate.getTime()) < 30000;
        }
        return false;
      }));
      
      if (recentNewMurexIds.size > 0) {
        setNewMurexImportIds(recentNewMurexIds);
        
        // Show message for new Murex push
        const message = `🚀 ${recentNewMurexIds.size} new import${recentNewMurexIds.size > 1 ? 's' : ''} pushed to Murex!`;
        showToast(message, 'success');
        
        // Remove flash effect after 4 seconds
        setTimeout(() => {
          setNewMurexImportIds(new Set());
        }, 4000);
      }
    }
    
    // Update the tracking sets
    setPreviousMurexIds(currentMurexIds);
  }, [imports, previousMurexIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setIsToastVisible(true);
  };

  const handleProcessPendingTrades = async () => {
    if (pendingTradeCount === 0) {
      showToast('No pending trades to process', 'info');
      return;
    }

    try {
      const result = await liveTradeService.processPendingTrades();
      if (result) {
        // Switch to consolidated tab to show the new entry
        setActiveTab('consolidated');
        await loadImports();
        showToast(`Processed ${pendingTradeCount} live trades into consolidated import`, 'success');
        setPendingTradeCount(0);
        setLiveTradeRefreshTrigger(prev => prev + 1); // Trigger grid refresh
        
        // Add flash effect for the new import
        if (result.id) {
          setNewImportIds(new Set([result.id]));
          setTimeout(() => {
            setNewImportIds(new Set());
          }, 3000);
        }
      }
    } catch (error) {
      showToast('Failed to process pending trades', 'error');
    }
  };

  const loadImports = useCallback(async () => {
    try {
      const data = await tradeImportService.getAllImports();
      setImports(data);
    } catch (error) {
      console.error('Failed to load imports:', error);
      showToast('Failed to load imports', 'error');
    }
  }, []);

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

  const handleBulkClearConsolidated = () => {
    setIsBulkClearConfirmationOpen(true);
  };

  const handleConfirmBulkClearConsolidated = async () => {
    setIsBulkClearConfirmationOpen(false);
    setIsBulkProcessing(true);
    try {
      await tradeImportService.clearAllConsolidatedImports();
      await loadImports();
      showToast('All consolidated imports cleared successfully', 'success');
    } catch (error) {
      console.error('Failed to clear all consolidated imports:', error);
      showToast('Failed to clear all consolidated imports', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkGenerateMXML = () => {
    setIsBulkGenerateConfirmationOpen(true);
  };

  const handleConfirmBulkGenerateMXML = async () => {
    setIsBulkGenerateConfirmationOpen(false);
    setIsBulkProcessing(true);
    try {
      const results = await tradeImportService.generateMXMLForAllConsolidated();
      await loadImports();
      showToast(`MXML generated for ${results.length} consolidated import${results.length !== 1 ? 's' : ''}`, 'success');
    } catch (error) {
      console.error('Failed to generate MXML for all consolidated imports:', error);
      showToast('Failed to generate MXML for all consolidated imports', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkPushToMurex = async () => {
    try {
      setIsBulkProcessing(true);
      const results = await tradeImportService.pushAllToMurex();
      await loadImports();
      showToast(`Pushed ${results.length} import${results.length !== 1 ? 's' : ''} to Murex`, 'success');
    } catch (error) {
      console.error('Failed to push imports to Murex:', error);
      showToast('Failed to push imports to Murex', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkClearMXML = async () => {
    try {
      setIsBulkProcessing(true);
      await tradeImportService.clearAllMXMLImports();
      await loadImports();
      showToast('All MXML imports cleared', 'success');
    } catch (error) {
      console.error('Failed to clear MXML imports:', error);
      showToast('Failed to clear MXML imports', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkClearMurex = async () => {
    try {
      setIsBulkProcessing(true);
      await tradeImportService.clearAllMurexImports();
      await loadImports();
      showToast('All Murex imports cleared', 'success');
    } catch (error) {
      console.error('Failed to clear Murex imports:', error);
      showToast('Failed to clear Murex imports', 'error');
    } finally {
      setIsBulkProcessing(false);
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        {/* Import controls and sub-tabs - only show in imports tab */}
        {activeTab === 'imports' && (
          <div className="mb-6">
            {/* Sub-tabs for imports */}
            <div className="flex border-b border-fd-border mb-4">
              <button
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  importsSubTab === 'live'
                    ? 'border-fd-green text-fd-green'
                    : 'border-transparent text-fd-text-muted hover:text-fd-text'
                }`}
                onClick={() => setImportsSubTab('live')}
              >
                Live Trades {pendingTradeCount > 0 && `(${pendingTradeCount} pending)`}
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  importsSubTab === 'csv'
                    ? 'border-fd-green text-fd-green'
                    : 'border-transparent text-fd-text-muted hover:text-fd-text'
                }`}
                onClick={() => setImportsSubTab('csv')}
              >
                CSV Imports
              </button>
            </div>

            {/* Controls based on active sub-tab */}
            {importsSubTab === 'csv' && (
              <div className="flex justify-end gap-2">
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

            {importsSubTab === 'live' && (
              <div className="flex justify-end gap-2 mb-6">
                <button
                  onClick={handleProcessPendingTrades}
                  disabled={pendingTradeCount === 0}
                  className="btn btn-primary"
                >
                  Process Pending Trades ({pendingTradeCount})
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bulk actions for consolidated tab */}
        {activeTab === 'consolidated' && (
          <div className="mb-6 flex justify-end gap-2">
            <button
              onClick={handleBulkGenerateMXML}
              disabled={isBulkProcessing || imports.filter(imp => imp.status === 'CONSOLIDATED').length === 0}
              className="btn btn-primary"
            >
              {isBulkProcessing ? 'Processing...' : 'Generate MXML for All'}
            </button>
            <button
              onClick={handleBulkClearConsolidated}
              disabled={isBulkProcessing || imports.filter(imp => imp.status === 'CONSOLIDATED').length === 0}
              className="btn btn-outline text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
            >
              {isBulkProcessing ? 'Processing...' : 'Clear All'}
            </button>
          </div>
        )}

        {/* Bulk actions for MXML tab */}
        {activeTab === 'mxml' && (
          <div className="mb-6 flex justify-end gap-2">
            <button
              onClick={handleBulkPushToMurex}
              disabled={isBulkProcessing || imports.filter(imp => imp.status === 'MXML_GENERATED').length === 0}
              className="btn btn-primary"
            >
              {isBulkProcessing ? 'Processing...' : 'Push All to Murex'}
            </button>
            <button
              onClick={handleBulkClearMXML}
              disabled={isBulkProcessing || imports.filter(imp => imp.status === 'MXML_GENERATED').length === 0}
              className="btn btn-outline text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
            >
              {isBulkProcessing ? 'Processing...' : 'Clear All'}
            </button>
          </div>
        )}

        {/* Bulk actions for Murex tab */}
        {activeTab === 'murex' && (
          <div className="mb-6 flex justify-end gap-2">
            <button
              onClick={handleBulkClearMurex}
              disabled={isBulkProcessing || imports.filter(imp => imp.status === 'PUSHED_TO_MUREX').length === 0}
              className="btn btn-outline text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
            >
              {isBulkProcessing ? 'Processing...' : 'Clear All'}
            </button>
          </div>
        )}
        
        {/* Real-time activity indicator for consolidated tab */}
        {activeTab === 'consolidated' && (
          <div className="mb-4 p-4 bg-fd-darker border border-fd-border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-fd-green rounded-full animate-pulse"></span>
                <span className="text-fd-text text-sm">Live monitoring active</span>
                <span className="text-fd-text-muted text-xs">
                  - watching for automatic trade consolidation
                </span>
              </div>
              <div className="text-fd-text-muted text-xs">
                Last refresh: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* Real-time activity indicator for MXML tab */}
        {activeTab === 'mxml' && (
          <div className="mb-4 p-4 bg-fd-darker border border-fd-border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-fd-green rounded-full animate-pulse"></span>
                <span className="text-fd-text text-sm">Live monitoring active</span>
                <span className="text-fd-text-muted text-xs">
                  - watching for automatic MXML generation
                </span>
              </div>
              <div className="text-fd-text-muted text-xs">
                Auto-refreshing every 3 seconds • New entries highlighted
              </div>
            </div>
          </div>
        )}

        {/* Real-time activity indicator for Murex tab */}
        {activeTab === 'murex' && (
          <div className="mb-4 p-4 bg-fd-darker border border-fd-border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-fd-green rounded-full animate-pulse"></span>
                <span className="text-fd-text text-sm">Live monitoring active</span>
                <span className="text-fd-text-muted text-xs">
                  - watching for automatic Murex pushes
                </span>
              </div>
              <div className="text-fd-text-muted text-xs">
                Auto-refreshing every 3 seconds • New entries highlighted
              </div>
            </div>
          </div>
        )}

        {/* Content based on active tab and sub-tab */}
        {activeTab === 'dashboard' ? (
          <Dashboard 
            imports={imports}
            demoConfig={demoConfig}
            onRefresh={loadImports}
          />
        ) : activeTab === 'imports' && importsSubTab === 'live' ? (
          <LiveTradesGrid
            refreshTrigger={liveTradeRefreshTrigger}
          />
        ) : (
          <>
            {filteredImports.length === 0 ? (
              <div className="text-center text-fd-text-muted py-16">
                <p className="text-lg">No imports in this status</p>
              </div>
            ) : (
              <div className="bg-fd-darker rounded-lg border border-fd-border">
                {renderImportsTableContent(filteredImports)}
              </div>
            )}
          </>
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
            <tr 
              key={importItem.id} 
              className={`${
                newImportIds.has(importItem.id) 
                  ? importItem.importName.startsWith('LIVE-')
                    ? 'animate-pulse bg-gradient-to-r from-fd-green to-blue-500 bg-opacity-30 border-2 border-fd-green shadow-lg transform scale-105 transition-all duration-1000'
                    : 'animate-pulse bg-fd-green bg-opacity-20 border-fd-green'
                  : newMxmlImportIds.has(importItem.id)
                    ? 'animate-pulse bg-gradient-to-r from-yellow-400 to-orange-500 bg-opacity-30 border-2 border-yellow-400 shadow-lg transform scale-105 transition-all duration-1000'
                    : newMurexImportIds.has(importItem.id)
                      ? 'animate-pulse bg-gradient-to-r from-purple-400 to-pink-500 bg-opacity-30 border-2 border-purple-400 shadow-lg transform scale-105 transition-all duration-1000'
                      : ''
              }`}
            >
              <td className="font-medium">
                {importItem.importName}
                {(newImportIds.has(importItem.id) || newMxmlImportIds.has(importItem.id) || newMurexImportIds.has(importItem.id)) && (
                  <div className="inline-flex items-center ml-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium animate-bounce mr-1 ${
                      newMurexImportIds.has(importItem.id)
                        ? 'bg-purple-400 text-white'
                        : newMxmlImportIds.has(importItem.id) 
                          ? 'bg-yellow-400 text-black' 
                          : 'bg-fd-green text-black'
                    }`}>
                      {newMurexImportIds.has(importItem.id) ? '🚀 MUREX' : newMxmlImportIds.has(importItem.id) ? '⚡ MXML' : '✨ NEW'}
                    </span>
                    {importItem.importName.startsWith('LIVE-') && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white animate-pulse">
                        AUTO
                      </span>
                    )}
                  </div>
                )}
              </td>
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
              className={`nav-tab ${activeTab === 'dashboard' ? 'active' : 'inactive'}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`nav-tab ${activeTab === 'imports' ? 'active' : 'inactive'}`}
              onClick={() => setActiveTab('imports')}
            >
              Imports ({imports.filter(imp => imp.status === 'IMPORTED').length})
            </button>
            <button
              className={`nav-tab ${activeTab === 'consolidated' ? 'active' : 'inactive'} relative`}
              onClick={() => setActiveTab('consolidated')}
            >
              Consolidated ({imports.filter(imp => imp.status === 'CONSOLIDATED').length})
              {activeTab === 'consolidated' && (
                <span className="ml-2 inline-flex items-center">
                  <span className="w-2 h-2 bg-fd-green rounded-full animate-pulse"></span>
                  <span className="text-xs text-fd-text-muted ml-1">auto-refresh</span>
                </span>
              )}
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

      <ConfirmationModal
        isOpen={isBulkClearConfirmationOpen}
        title="Clear All Consolidated Imports"
        message="Are you sure you want to clear ALL consolidated imports? This action cannot be undone and will remove all consolidated trades and associated data."
        confirmText="Clear All"
        cancelText="Cancel"
        onConfirm={handleConfirmBulkClearConsolidated}
        onCancel={() => setIsBulkClearConfirmationOpen(false)}
        isLoading={isBulkProcessing}
      />

      <ConfirmationModal
        isOpen={isBulkGenerateConfirmationOpen}
        title="Generate MXML for All"
        message={`Generate MXML files for all ${imports.filter(imp => imp.status === 'CONSOLIDATED').length} consolidated imports? This will move them to the MXML Generated tab.`}
        confirmText="Generate All"
        cancelText="Cancel"
        onConfirm={handleConfirmBulkGenerateMXML}
        onCancel={() => setIsBulkGenerateConfirmationOpen(false)}
        isLoading={isBulkProcessing}
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
