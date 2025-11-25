import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  isVisible,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'border-fd-green bg-green-900 bg-opacity-20 text-green-200';
      case 'error':
        return 'border-red-500 bg-red-900 bg-opacity-20 text-red-200';
      case 'info':
        return 'border-fd-border bg-fd-darker text-fd-text';
      default:
        return 'border-fd-border bg-fd-darker text-fd-text';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`border rounded-lg p-4 shadow-fd flex items-center gap-3 min-w-80 max-w-96 ${getTypeStyles()}`}>
        <span className="text-lg font-semibold">{getIcon()}</span>
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="text-current hover:opacity-70 transition-opacity text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export interface ToastManager {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}