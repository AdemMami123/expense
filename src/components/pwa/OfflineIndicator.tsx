import React, { useState, useEffect } from 'react';
import { pwaUtils } from '../../lib/pwa-utils';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const cleanup = pwaUtils.addNetworkListeners(
      () => {
        setIsOnline(true);
        setShowOfflineMessage(false);
      },
      () => {
        setIsOnline(false);
        setShowOfflineMessage(true);
      }
    );

    return cleanup;
  }, []);

  // Auto-hide offline message after 5 seconds
  useEffect(() => {
    if (showOfflineMessage) {
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showOfflineMessage]);

  if (isOnline && !showOfflineMessage) {
    return null;
  }

  return (
    <div className="fixed top-16 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-40">
      <div className={`card p-3 shadow-lg border-l-4 ${
        isOnline 
          ? 'border-green-500 bg-green-50 dark:bg-green-900' 
          : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900'
      }`}>
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0">
            {isOnline ? (
              <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0 0L5.636 18.364m12.728 0L5.636 5.636m12.728 12.728L18.364 5.636" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${
              isOnline 
                ? 'text-green-800 dark:text-green-200' 
                : 'text-yellow-800 dark:text-yellow-200'
            }`}>
              {isOnline ? 'Back online!' : 'You\'re offline'}
            </p>
            <p className={`text-xs ${
              isOnline 
                ? 'text-green-600 dark:text-green-300' 
                : 'text-yellow-600 dark:text-yellow-300'
            }`}>
              {isOnline 
                ? 'Your data will sync automatically' 
                : 'You can still add expenses offline'
              }
            </p>
          </div>
          <button
            onClick={() => setShowOfflineMessage(false)}
            className={`flex-shrink-0 ${
              isOnline 
                ? 'text-green-400 hover:text-green-600 dark:hover:text-green-300' 
                : 'text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;
