import React, { useState, useRef, useEffect } from 'react';
import { DemoConfigModal } from '../DemoConfigModal';
import { DemoConfig } from '../../types/liveTrade';
import { liveTradeService } from '../../services/liveTradeService';

export const TopBar: React.FC = () => {
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [demoConfig, setDemoConfig] = useState<DemoConfig>({
    enabled: false,
    tradesPerSecond: 2.0,
    groupingIntervalSeconds: 10,
    autoMxmlEnabled: false,
    mxmlGenerationIntervalSeconds: 20,
    autoMurexEnabled: false,
    murexPushIntervalSeconds: 30,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load demo config on mount
  useEffect(() => {
    const loadDemoConfig = async () => {
      try {
        const config = await liveTradeService.getDemoConfig();
        setDemoConfig(config);
      } catch (error) {
        console.error('Failed to load demo config:', error);
      }
    };
    loadDemoConfig();
  }, []);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAdminMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const toggleAdminMenu = () => {
    setIsAdminMenuOpen(!isAdminMenuOpen);
  };

  const handleOpenConfig = () => {
    setIsConfigModalOpen(true);
    setIsAdminMenuOpen(false);
  };

  const handleSaveConfig = async (config: DemoConfig) => {
    try {
      const updatedConfig = await liveTradeService.updateDemoConfig(config);
      setDemoConfig(updatedConfig);
    } catch (error) {
      console.error('Failed to update demo config:', error);
    }
  };

  return (
    <nav className="bg-fd-darker border-b border-fd-border py-3 px-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-fd-green rounded-full"></div>
          <span className="text-fd-green font-medium">SYSTEM ONLINE</span>
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={toggleAdminMenu}
            className="btn btn-outline flex items-center"
          >
            <span>Admin</span>
            <svg 
              className={`ml-2 w-4 h-4 transition-transform duration-200 ${isAdminMenuOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          
          {isAdminMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 py-2 bg-fd-darker rounded-md shadow-fd border border-fd-border z-10">
              <button
                onClick={handleOpenConfig}
                className="w-full px-4 py-2 text-left text-fd-text hover:bg-fd-dark flex items-center justify-between"
              >
                <span>Demo Configuration</span>
                <span className={`w-2 h-2 rounded-full ${
                  demoConfig.enabled ? 'bg-fd-green' : 'bg-fd-text-muted'
                }`}></span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      <DemoConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={handleSaveConfig}
        initialConfig={demoConfig}
      />
    </nav>
  );
};

export default TopBar;