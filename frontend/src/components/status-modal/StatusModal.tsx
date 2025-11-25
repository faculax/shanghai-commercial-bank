import React, { useState, useEffect } from 'react';
import { healthService, ServiceHealthResponse } from '../../services/healthService';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({ isOpen, onClose }) => {
  const [healthData, setHealthData] = useState<ServiceHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [pollInterval, setPollInterval] = useState(5); // seconds

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchHealth = async () => {
      try {
        setLoading(true);
        const data = await healthService.getSystemHealth();
        setHealthData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch health data');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch when modal is open
    if (isOpen) {
      // Initial fetch
      fetchHealth();

      // Set up polling if autoRefresh is enabled
      if (autoRefresh) {
        intervalId = setInterval(fetchHealth, pollInterval * 1000);
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, autoRefresh, pollInterval]);

  const handleRefreshNow = () => {
    healthService.getSystemHealth()
      .then((data: ServiceHealthResponse) => {
        setHealthData(data);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch health data');
      });
  };

  const handleAutoRefreshToggle = () => {
    setAutoRefresh(!autoRefresh);
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPollInterval(Number(e.target.value));
  };

  const getStatusColor = (status: string) => {
    return status === 'UP' ? 'text-green-500' : 'text-red-500';
  };

  const getHealthStatusColor = (health: number) => {
    if (health >= 80) return 'text-green-500';
    if (health >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getFormattedTime = (timestamp: number | undefined) => {
    if (!timestamp) {
      return "Not available";
    }
    try {
      // Make sure timestamp is a valid number
      const numTimestamp = Number(timestamp);
      if (isNaN(numTimestamp)) {
        return "Invalid timestamp";
      }
      const date = new Date(numTimestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      
      return date.toLocaleString();
    } catch (e) {
      console.error("Error formatting timestamp:", e, timestamp);
      return "Error formatting time";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75">
      <div className="bg-fd-darker text-fd-text w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg shadow-lg">
        <div className="sticky top-0 bg-fd-darker px-6 py-4 border-b border-fd-border flex justify-between items-center">
          <h1 className="text-2xl font-bold text-fd-green">Services Status</h1>
          <button
            onClick={onClose}
            className="text-fd-text-light hover:text-fd-text"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-6 py-4 border-b border-fd-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-2">
            <span>Poll Interval</span>
            <select 
              value={pollInterval} 
              onChange={handleIntervalChange}
              className="bg-fd-dark border border-fd-border rounded px-2 py-1 text-fd-text"
            >
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">60 seconds</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="inline-flex items-center cursor-pointer">
              <span className="mr-2 text-sm">Auto Refresh</span>
              <div className="relative">
                <input type="checkbox" checked={autoRefresh} onChange={handleAutoRefreshToggle} className="sr-only" />
                <div className={`block w-10 h-6 rounded-full ${autoRefresh ? 'bg-fd-green' : 'bg-fd-border'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${autoRefresh ? 'transform translate-x-4' : ''}`}></div>
              </div>
              <span className="ml-2 text-sm">{autoRefresh ? `(${pollInterval} seconds)` : ''}</span>
            </label>
          </div>
          <button 
            onClick={handleRefreshNow}
            className="btn btn-outline flex items-center"
          >
            Refresh Now
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="mb-8 p-6 bg-fd-dark border border-fd-border rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Services Overview</h2>
            <div className="text-sm text-fd-text-light mb-4">
              Last updated: {healthData ? getFormattedTime(healthData.timestamp) : '-'}
            </div>
            
            {loading && !healthData ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fd-green"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 p-4 border border-red-800 bg-red-900 bg-opacity-20 rounded">
                {error}
              </div>
            ) : healthData ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-fd-darker p-4 rounded border border-fd-border">
                  <div className="text-fd-text-light mb-1">System Health</div>
                  <div className={`text-3xl font-bold ${getHealthStatusColor(healthData.systemHealth)}`}>
                    {healthData.systemHealth}%
                    <span className="text-xs ml-2 font-normal">
                      {healthData.systemHealth >= 80 ? 'Good' : healthData.systemHealth >= 50 ? 'Degraded' : 'Poor'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-fd-darker p-4 rounded border border-fd-border">
                  <div className="text-fd-text-light mb-1">Services Online</div>
                  <div className="text-3xl font-bold text-fd-green">
                    {healthData.servicesOnline}/{healthData.totalServices}
                  </div>
                </div>
                
                <div className="bg-fd-darker p-4 rounded border border-fd-border">
                  <div className="text-fd-text-light mb-1">Issues</div>
                  <div className="text-3xl font-bold text-red-500">
                    {healthData.totalServices - healthData.servicesOnline}
                  </div>
                </div>
                
                <div className="bg-fd-darker p-4 rounded border border-fd-border">
                  <div className="text-fd-text-light mb-1">Avg Response</div>
                  <div className="text-3xl font-bold text-fd-text">
                    {healthData.avgResponse}ms
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <h2 className="text-xl font-semibold mb-4">Service Details</h2>
          <div className="text-sm text-fd-text-light mb-4">
            Last updated: {healthData ? getFormattedTime(healthData.timestamp) : '-'}
            {autoRefresh && <span className="ml-2 text-fd-green">(Auto-refreshing every {pollInterval} seconds)</span>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Backend */}
            <div className="bg-fd-dark p-6 rounded-lg border border-fd-border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Main Backend</h3>
                {healthData && (
                  <span className={`px-3 py-1 rounded text-sm ${
                    healthData.mainBackend.status === 'UP' 
                      ? 'bg-green-900 bg-opacity-20 text-green-500' 
                      : 'bg-red-900 bg-opacity-20 text-red-500'
                  }`}>
                    {healthData.mainBackend.status === 'UP' ? 'ONLINE' : 'OFFLINE'}
                  </span>
                )}
              </div>
              
              {healthData ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">URL:</span>
                    <span className="col-span-2 truncate">{window.location.hostname}:8080</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">Response Time:</span>
                    <span className="col-span-2">
                      {healthData.mainBackend.responseTime}ms
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">Last Checked:</span>
                    <span className="col-span-2">
                      {getFormattedTime(healthData.mainBackend.timestamp)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">Service:</span>
                    <span className="col-span-2">
                      {healthData.mainBackend.serviceName || 'trading-platform'}
                    </span>
                  </div>
                  
                  {healthData.mainBackend.error && (
                    <div className="mt-4 text-red-500">
                      Error: {healthData.mainBackend.error}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fd-green"></div>
                </div>
              )}
            </div>
            
            {/* Gateway */}
            <div className="bg-fd-dark p-6 rounded-lg border border-fd-border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Gateway</h3>
                {healthData && (
                  <span className={`px-3 py-1 rounded text-sm ${
                    healthData.gateway.status === 'UP' 
                      ? 'bg-green-900 bg-opacity-20 text-green-500' 
                      : 'bg-red-900 bg-opacity-20 text-red-500'
                  }`}>
                    {healthData.gateway.status === 'UP' ? 'ONLINE' : 'OFFLINE'}
                  </span>
                )}
              </div>
              
              {healthData ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">URL:</span>
                    <span className="col-span-2 truncate">{window.location.hostname}:8081</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">Response Time:</span>
                    <span className="col-span-2">
                      {healthData.gateway.responseTime}ms
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">Last Checked:</span>
                    <span className="col-span-2">
                      {getFormattedTime(healthData.gateway.timestamp)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">Service:</span>
                    <span className="col-span-2">
                      {healthData.gateway.serviceName || 'gateway'}
                    </span>
                  </div>
                  
                  {healthData.gateway.error && (
                    <div className="mt-4 text-red-500">
                      Error: {healthData.gateway.error}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fd-green"></div>
                </div>
              )}
            </div>
            
            {/* Frontend */}
            <div className="bg-fd-dark p-6 rounded-lg border border-fd-border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Frontend</h3>
                {healthData && (
                  <span className={`px-3 py-1 rounded text-sm ${
                    healthData.frontend.status === 'UP' 
                      ? 'bg-green-900 bg-opacity-20 text-green-500' 
                      : 'bg-red-900 bg-opacity-20 text-red-500'
                  }`}>
                    {healthData.frontend.status === 'UP' ? 'ONLINE' : 'OFFLINE'}
                  </span>
                )}
              </div>
              
              {healthData ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">URL:</span>
                    <span className="col-span-2 truncate">{window.location.origin}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">Response Time:</span>
                    <span className="col-span-2">
                      0ms (Local)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">Last Checked:</span>
                    <span className="col-span-2">
                      {getFormattedTime(healthData.frontend.timestamp)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">Version:</span>
                    <span className="col-span-2">
                      1.0.0
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fd-green"></div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Database */}
            <div className="bg-fd-dark p-6 rounded-lg border border-fd-border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">PostgreSQL Database</h3>
                {healthData && (
                  <span className={`px-3 py-1 rounded text-sm ${
                    healthData.database.status === 'UP' 
                      ? 'bg-green-900 bg-opacity-20 text-green-500' 
                      : 'bg-red-900 bg-opacity-20 text-red-500'
                  }`}>
                    {healthData.database.status === 'UP' ? 'ONLINE' : 'OFFLINE'}
                  </span>
                )}
              </div>
              
              {healthData ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">Host:</span>
                    <span className="col-span-2 truncate">postgres:5432/fundsmith</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">Response Time:</span>
                    <span className="col-span-2">
                      {healthData.database.responseTime}ms
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">Last Checked:</span>
                    <span className="col-span-2">
                      {getFormattedTime(healthData.database.timestamp)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">Version:</span>
                    <span className="col-span-2">
                      PostgreSQL 14.5
                    </span>
                  </div>
                  
                  {healthData.database.error && (
                    <div className="mt-4 text-red-500">
                      Error: {healthData.database.error}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fd-green"></div>
                </div>
              )}
            </div>
            
            {/* Cash Flow Service */}
            <div className="bg-fd-dark p-6 rounded-lg border border-fd-border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Cash Flow Service</h3>
                {healthData && (
                  <span className={`px-3 py-1 rounded text-sm ${
                    healthData.cashFlowService.status === 'UP' 
                      ? 'bg-green-900 bg-opacity-20 text-green-500' 
                      : 'bg-red-900 bg-opacity-20 text-red-500'
                  }`}>
                    {healthData.cashFlowService.status === 'UP' ? 'ONLINE' : 'OFFLINE'}
                  </span>
                )}
              </div>
              
              {healthData ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">URL:</span>
                    <span className="col-span-2 truncate">cashflow.api.internal</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">Response Time:</span>
                    <span className="col-span-2">
                      {healthData.cashFlowService.responseTime}ms
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">Last Checked:</span>
                    <span className="col-span-2">
                      {getFormattedTime(healthData.cashFlowService.timestamp)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">Service:</span>
                    <span className="col-span-2">
                      cash-flow-service
                    </span>
                  </div>
                  
                  {healthData.cashFlowService.error && (
                    <div className="mt-4 text-red-500">
                      Error: {healthData.cashFlowService.error}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fd-green"></div>
                </div>
              )}
            </div>
            
            {/* Positions Service */}
            <div className="bg-fd-dark p-6 rounded-lg border border-fd-border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Positions Service</h3>
                {healthData && (
                  <span className={`px-3 py-1 rounded text-sm ${
                    healthData.positionsService.status === 'UP' 
                      ? 'bg-green-900 bg-opacity-20 text-green-500' 
                      : 'bg-red-900 bg-opacity-20 text-red-500'
                  }`}>
                    {healthData.positionsService.status === 'UP' ? 'ONLINE' : 'OFFLINE'}
                  </span>
                )}
              </div>
              
              {healthData ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">URL:</span>
                    <span className="col-span-2 truncate">positions.api.internal</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">Response Time:</span>
                    <span className="col-span-2">
                      {healthData.positionsService.responseTime}ms
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">Last Checked:</span>
                    <span className="col-span-2">
                      {getFormattedTime(healthData.positionsService.timestamp)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-fd-text-light">Service:</span>
                    <span className="col-span-2">
                      positions-service
                    </span>
                  </div>
                  
                  {healthData.positionsService.error && (
                    <div className="mt-4 text-red-500">
                      Error: {healthData.positionsService.error}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fd-green"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusModal;