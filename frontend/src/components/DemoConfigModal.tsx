import React, { useState, useEffect } from 'react';
import { DemoConfig } from '../types/liveTrade';

interface DemoConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: DemoConfig) => void;
  initialConfig: DemoConfig;
}

export const DemoConfigModal: React.FC<DemoConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig,
}) => {
  const [config, setConfig] = useState<DemoConfig>(initialConfig);

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const handleChange = (field: keyof DemoConfig, value: any) => {
    setConfig((prev: DemoConfig) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-fd-darker rounded-lg border border-fd-border p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-fd-text">Demo Configuration</h2>
          <button
            onClick={onClose}
            className="text-fd-text-muted hover:text-fd-text"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-fd-text font-medium">Demo Mode</span>
              <button
                onClick={() => handleChange('enabled', !config.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.enabled ? 'bg-fd-green' : 'bg-fd-border'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-fd-text-muted mt-1">
              {config.enabled ? 'Demo mode is active - generating trades automatically' : 'Demo mode is disabled - no automatic trade generation'}
            </p>
          </div>

          {config.enabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-fd-text mb-1">
                  Trades Per Second
                </label>
                <input
                  type="number"
                  value={config.tradesPerSecond}
                  onChange={(e) => handleChange('tradesPerSecond', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-fd-dark border border-fd-border rounded-md text-fd-text focus:outline-none focus:ring-2 focus:ring-fd-green"
                  min="0.1"
                  max="10"
                  step="0.1"
                />
                <p className="text-xs text-fd-text-muted mt-1">
                  Rate at which demo trades are generated (0.1 - 10.0)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-fd-text mb-1">
                  Grouping Interval (seconds)
                </label>
                <input
                  type="number"
                  value={config.groupingIntervalSeconds}
                  onChange={(e) => handleChange('groupingIntervalSeconds', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-fd-dark border border-fd-border rounded-md text-fd-text focus:outline-none focus:ring-2 focus:ring-fd-green"
                  min="1"
                  max="300"
                  step="1"
                />
                <p className="text-xs text-fd-text-muted mt-1">
                  How often trades are grouped and sent to consolidation (1 - 300 seconds)
                </p>
              </div>

              <div className="border-t border-fd-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-fd-text font-medium">Auto MXML Generation</span>
                  <button
                    onClick={() => handleChange('autoMxmlEnabled', !config.autoMxmlEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.autoMxmlEnabled ? 'bg-fd-green' : 'bg-fd-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.autoMxmlEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-fd-text-muted mb-3">
                  {config.autoMxmlEnabled 
                    ? 'Automatically generate MXML for consolidated imports' 
                    : 'Manual MXML generation only'
                  }
                </p>

                {config.autoMxmlEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-fd-text mb-1">
                      MXML Generation Interval (seconds)
                    </label>
                    <input
                      type="number"
                      value={config.mxmlGenerationIntervalSeconds}
                      onChange={(e) => handleChange('mxmlGenerationIntervalSeconds', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-fd-dark border border-fd-border rounded-md text-fd-text focus:outline-none focus:ring-2 focus:ring-fd-green"
                      min="5"
                      max="600"
                      step="1"
                    />
                    <p className="text-xs text-fd-text-muted mt-1">
                      How often to auto-generate MXML for consolidated imports (5 - 600 seconds)
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <div>
            {config.enabled && (
              <button
                onClick={() => {
                  handleChange('enabled', false);
                  onSave({ ...config, enabled: false });
                  onClose();
                }}
                className="btn btn-outline text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
              >
                Stop Demo Mode
              </button>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};