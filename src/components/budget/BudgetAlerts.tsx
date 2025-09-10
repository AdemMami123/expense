import React from 'react';
import type { BudgetAlert } from '../../types/budget';
import { BudgetService } from '../../lib/budget-service';

interface BudgetAlertsProps {
  alerts: BudgetAlert[];
  onDismissAlert: (alertId: string) => void;
}

const BudgetAlerts: React.FC<BudgetAlertsProps> = ({ alerts, onDismissAlert }) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'exceeded':
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'approaching':
        return (
          <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'exceeded':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'approaching':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const alertDate = new Date(dateString);
    const diffMs = now.getTime() - alertDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return alertDate.toLocaleDateString();
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Budget Alerts ({alerts.length})
      </h3>
      
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`border rounded-lg p-4 ${getAlertStyle(alert.type)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {getAlertIcon(alert.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {alert.message}
                </p>
                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatTimeAgo(alert.createdAt)}</span>
                  <span>•</span>
                  <span>{alert.percentage}% of budget used</span>
                  {alert.category && (
                    <>
                      <span>•</span>
                      <span>{alert.category}</span>
                    </>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                  <span className="font-medium">
                    {BudgetService.formatCurrency(alert.currentAmount)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400"> of </span>
                  <span className="font-medium">
                    {BudgetService.formatCurrency(alert.budgetAmount)}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => onDismissAlert(alert.id)}
              className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
              title="Dismiss alert"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BudgetAlerts;
