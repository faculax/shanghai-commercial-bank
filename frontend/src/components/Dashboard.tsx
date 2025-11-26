import React, { useState, useEffect } from 'react';
import { TradeImport } from '../types/tradeImport';
import { DemoConfig } from '../types/liveTrade';
import { liveTradeService } from '../services/liveTradeService';

interface DashboardProps {
  imports: TradeImport[];
  demoConfig: DemoConfig;
  onRefresh: () => void;
}

interface Stats {
  imported: number;
  consolidated: number;
  mxmlGenerated: number;
  pushedToMurex: number;
  pendingTrades: number;
  total: number;
}

interface ConsolidationMetrics {
  last2Rate: number;
  last10Rate: number;
  allTimeRate: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ imports, demoConfig, onRefresh }) => {
  const [stats, setStats] = useState<Stats>({
    imported: 0,
    consolidated: 0,
    mxmlGenerated: 0,
    pushedToMurex: 0,
    pendingTrades: 0,
    total: 0,
  });
  const [consolidationMetrics, setConsolidationMetrics] = useState<ConsolidationMetrics>({
    last2Rate: 0,
    last10Rate: 0,
    allTimeRate: 0,
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const calculateStats = async () => {
    const imported = imports.filter(imp => imp.status === 'IMPORTED').length;
    const consolidated = imports.filter(imp => imp.status === 'CONSOLIDATED').length;
    const mxmlGenerated = imports.filter(imp => imp.status === 'MXML_GENERATED').length;
    const pushedToMurex = imports.filter(imp => imp.status === 'PUSHED_TO_MUREX').length;
    const total = imports.length;
    
    // Calculate consolidation metrics
    const consolidatedImports = imports.filter(imp => 
      imp.status === 'CONSOLIDATED' || 
      imp.status === 'MXML_GENERATED' || 
      imp.status === 'PUSHED_TO_MUREX'
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const calculateConsolidationRate = (importsSubset: typeof consolidatedImports) => {
      let totalOriginal = 0;
      let totalConsolidated = 0;
      
      importsSubset.forEach(imp => {
        totalOriginal += imp.originalTradeCount;
        totalConsolidated += imp.currentTradeCount;
      });
      
      return totalOriginal > 0 ? Math.round((totalConsolidated / totalOriginal) * 100) : 0;
    };
    
    const last2Rate = calculateConsolidationRate(consolidatedImports.slice(0, 2));
    const last10Rate = calculateConsolidationRate(consolidatedImports.slice(0, 10));
    const allTimeRate = calculateConsolidationRate(consolidatedImports);
    
    let pendingTrades = 0;
    try {
      pendingTrades = await liveTradeService.getPendingTradeCount();
    } catch (error) {
      console.error('Failed to get pending trades count:', error);
    }

    setStats({
      imported,
      consolidated,
      mxmlGenerated,
      pushedToMurex,
      pendingTrades,
      total,
    });
    
    setConsolidationMetrics({
      last2Rate,
      last10Rate,
      allTimeRate,
    });
    
    setLastUpdate(new Date());
  };

  useEffect(() => {
    calculateStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imports]);

  // Auto-refresh data - faster in demo mode, slower otherwise
  useEffect(() => {
    const refreshInterval = demoConfig.enabled ? 1000 : 3000;
    console.log('Dashboard: Setting up refresh interval:', refreshInterval + 'ms');
    
    const interval = setInterval(() => {
      console.log('Dashboard: Refreshing data at', new Date().toLocaleTimeString());
      onRefresh();
      setLastUpdate(new Date());
    }, refreshInterval);
    
    return () => {
      console.log('Dashboard: Cleaning up refresh interval');
      clearInterval(interval);
    };
  }, [demoConfig.enabled, onRefresh]);

  const StatCard: React.FC<{
    title: string;
    value: number;
    color: string;
    description: string;
    trend?: 'up' | 'down' | 'stable';
  }> = ({ title, value, color, description, trend }) => (
    <div className="bg-fd-darker rounded-lg border border-fd-border p-6 hover:border-fd-green transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-fd-text">{title}</h3>
        {trend && (
          <span className={`text-xs ${
            trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-fd-text-muted'
          }`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↙' : '→'}
          </span>
        )}
      </div>
      <div className={`text-3xl font-bold ${color} mb-1`}>
        {value.toLocaleString()}
      </div>
      <div className="text-fd-text-muted text-sm">
        {description}
      </div>
    </div>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'imported': return 'text-blue-400';
      case 'consolidated': return 'text-fd-green';
      case 'mxml': return 'text-yellow-400';
      case 'murex': return 'text-purple-400';
      case 'pending': return 'text-orange-400';
      default: return 'text-fd-text';
    }
  };

  const getConsolidationRateColor = (rate: number) => {
    if (rate <= 30) return 'text-fd-green';    // Very good consolidation
    if (rate <= 60) return 'text-yellow-400'; // Moderate consolidation
    return 'text-red-400';                     // Poor consolidation
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-fd-text">System Dashboard</h2>
          <p className="text-fd-text-muted">Real-time overview of trade processing pipeline</p>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-2 text-sm text-fd-text-muted">
            {demoConfig.enabled && (
              <>
                <span className="w-2 h-2 bg-fd-green rounded-full animate-pulse"></span>
                <span>Demo mode active</span>
              </>
            )}
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Demo Mode Status */}
      {demoConfig.enabled && (
        <div className="bg-fd-darker rounded-lg border border-fd-border p-3 opacity-80">
          <h3 className="text-sm font-medium text-fd-text-muted mb-2">Demo Mode Active</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-fd-text-muted">Trade Rate:</span>
              <span className="text-fd-text ml-2 font-medium">{demoConfig.tradesPerSecond}/sec</span>
            </div>
            <div>
              <span className="text-fd-text-muted">Grouping:</span>
              <span className="text-fd-text ml-2 font-medium">{demoConfig.groupingIntervalSeconds}s</span>
            </div>
            <div>
              <span className="text-fd-text-muted">Auto MXML:</span>
              <span className={`ml-2 font-medium ${demoConfig.autoMxmlEnabled ? 'text-fd-green' : 'text-red-400'}`}>
                {demoConfig.autoMxmlEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {demoConfig.autoMxmlEnabled && (
              <div>
                <span className="text-fd-text-muted">MXML Interval:</span>
                <span className="text-fd-text ml-2 font-medium">{demoConfig.mxmlGenerationIntervalSeconds}s</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard
          title="CSV Manually Imported"
          value={stats.imported}
          color={getStatusColor('imported')}
          description="CSV imports ready"
        />
        <StatCard
          title="Pending Trades"
          value={stats.pendingTrades}
          color={getStatusColor('pending')}
          description="Awaiting consolidation"
          trend={demoConfig.enabled ? 'up' : 'stable'}
        />
        <StatCard
          title="Consolidated"
          value={stats.consolidated}
          color={getStatusColor('consolidated')}
          description="Grouped by criteria"
          trend={demoConfig.enabled ? 'up' : 'stable'}
        />
        <StatCard
          title="MXML Generated"
          value={stats.mxmlGenerated}
          color={getStatusColor('mxml')}
          description="Ready for Murex"
          trend={demoConfig.autoMxmlEnabled ? 'up' : 'stable'}
        />
        <StatCard
          title="Pushed to Murex"
          value={stats.pushedToMurex}
          color={getStatusColor('murex')}
          description="Processing complete"
          trend={demoConfig.autoMurexEnabled ? 'up' : 'stable'}
        />
      </div>

      {/* Consolidation Metrics */}
      <div className="bg-fd-darker rounded-lg border border-fd-border p-6">
        <h3 className="text-lg font-semibold text-fd-text mb-4">Consolidation Rate Analysis</h3>
        <p className="text-fd-text-muted text-sm mb-4">Lower percentages indicate better consolidation (fewer trades to process downstream)</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Last 2 Consolidations"
            value={consolidationMetrics.last2Rate}
            color={getConsolidationRateColor(consolidationMetrics.last2Rate)}
            description={`${consolidationMetrics.last2Rate}% remaining trades`}
          />
          <StatCard
            title="Last 10 Consolidations"
            value={consolidationMetrics.last10Rate}
            color={getConsolidationRateColor(consolidationMetrics.last10Rate)}
            description={`${consolidationMetrics.last10Rate}% remaining trades`}
          />
          <StatCard
            title="All-Time Average"
            value={consolidationMetrics.allTimeRate}
            color={getConsolidationRateColor(consolidationMetrics.allTimeRate)}
            description={`${consolidationMetrics.allTimeRate}% remaining trades`}
          />
        </div>
      </div>

      {/* Pipeline Flow Visualization */}
      <div className="bg-fd-darker rounded-lg border border-fd-border p-6">
        <h3 className="text-lg font-semibold text-fd-text mb-4">Processing Pipeline</h3>
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <div className="w-12 h-12 mx-auto bg-orange-500 rounded-full flex items-center justify-center text-white font-bold mb-2">
              {stats.pendingTrades}
            </div>
            <div className="text-sm text-fd-text">Pending</div>
          </div>
          <div className="w-8 flex justify-center">
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-fd-text-muted"></div>
          </div>
          <div className="flex-1 text-center">
            <div className="w-12 h-12 mx-auto bg-fd-green rounded-full flex items-center justify-center text-black font-bold mb-2">
              {stats.consolidated}
            </div>
            <div className="text-sm text-fd-text">Consolidated</div>
          </div>
          <div className="w-8 flex justify-center">
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-fd-text-muted"></div>
          </div>
          <div className="flex-1 text-center">
            <div className="w-12 h-12 mx-auto bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold mb-2">
              {stats.mxmlGenerated}
            </div>
            <div className="text-sm text-fd-text">MXML</div>
          </div>
          <div className="w-8 flex justify-center">
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-fd-text-muted"></div>
          </div>
          <div className="flex-1 text-center">
            <div className="w-12 h-12 mx-auto bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mb-2">
              {stats.pushedToMurex}
            </div>
            <div className="text-sm text-fd-text">Murex</div>
          </div>
        </div>
      </div>

      {/* Total Summary */}
      <div className="bg-fd-darker rounded-lg border border-fd-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-fd-text">Total Imports Processed</h3>
            <p className="text-fd-text-muted text-sm">All-time system activity</p>
          </div>
          <div className="text-4xl font-bold text-fd-green">
            {stats.total.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};