import React, { useState, useEffect } from 'react';
import { pwaUtils } from '../../lib/pwa-utils';

const InstallPrompt: React.FC = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check initial state
    setCanInstall(pwaUtils.canInstall());
    setIsInstalled(pwaUtils.getInstallStatus());

    // Show prompt after a delay if can install
    const timer = setTimeout(() => {
      if (pwaUtils.canInstall() && !pwaUtils.getInstallStatus()) {
        setShowPrompt(true);
      }
    }, 5000); // Show after 5 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const installed = await pwaUtils.showInstallPrompt();
      if (installed) {
        setIsInstalled(true);
        setCanInstall(false);
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Error installing app:', error);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  // Don't show if already installed or can't install
  if (isInstalled || !canInstall || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="card p-4 shadow-lg border-l-4 border-blue-500">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Install Expense Tracker
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Install our app for a better experience and offline access.
            </p>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleInstall}
                disabled={installing}
                className="btn-primary text-xs py-1 px-3 disabled:opacity-50"
              >
                {installing ? 'Installing...' : 'Install'}
              </button>
              <button
                onClick={handleDismiss}
                className="btn-secondary text-xs py-1 px-3"
              >
                Later
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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

export default InstallPrompt;
