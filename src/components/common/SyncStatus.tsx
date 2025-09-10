import React, { useState, useEffect } from 'react';

interface SyncStatusProps {
  unsyncedCount: number;
  isOnline: boolean;
  onManualSync?: () => Promise<void>;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ 
  unsyncedCount, 
  isOnline, 
  onManualSync 
}) => {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const handleManualSync = async () => {
    if (!onManualSync || !isOnline || syncing) return;
    
    setSyncing(true);
    try {
      await onManualSync();
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const formatLastSync = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      {/* Online/Offline Status */}
      <div className="flex items-center space-x-1">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-gray-600 dark:text-gray-400">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Unsynced Count */}
      {unsyncedCount > 0 && (
        <div className="flex items-center space-x-1">
          <svg className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-yellow-600 dark:text-yellow-400">
            {unsyncedCount} unsynced
          </span>
        </div>
      )}

      {/* Manual Sync Button */}
      {isOnline && onManualSync && (
        <button
          onClick={handleManualSync}
          disabled={syncing}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
          title="Sync now"
        >
          {syncing ? (
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          <span>Sync</span>
        </button>
      )}

      {/* Last Sync Time */}
      {lastSyncTime && (
        <span className="text-gray-500 dark:text-gray-400 text-xs">
          Last sync: {formatLastSync(lastSyncTime)}
        </span>
      )}
    </div>
  );
};

export default SyncStatus;
