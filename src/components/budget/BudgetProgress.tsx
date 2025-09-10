import React from 'react';
import type { BudgetProgress } from '../../types/budget';
import { BudgetService } from '../../lib/budget-service';

interface BudgetProgressProps {
  budgets: BudgetProgress[];
  onEditBudget?: (budgetId: string) => void;
  onDeleteBudget?: (budgetId: string) => void;
}

const BudgetProgressCard: React.FC<BudgetProgressProps> = ({ 
  budgets, 
  onEditBudget, 
  onDeleteBudget 
}) => {
  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
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
      default:
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatPeriod = (period: string) => {
    return period.charAt(0).toUpperCase() + period.slice(1);
  };

  if (budgets.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No budgets</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create your first budget to start tracking your spending limits.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {budgets.map((budget) => (
        <div key={budget.budgetId} className="card">
          <div className="card-body">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(budget.status)}
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {budget.budgetName}
                  </h3>
                </div>
                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>{formatPeriod(budget.period)}</span>
                  {budget.category && (
                    <>
                      <span>•</span>
                      <span>{budget.category}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{budget.daysLeft} days left</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {onEditBudget && (
                  <button
                    onClick={() => onEditBudget(budget.budgetId)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Edit budget"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                {onDeleteBudget && (
                  <button
                    onClick={() => onDeleteBudget(budget.budgetId)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    title="Delete budget"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Spent: {BudgetService.formatCurrency(budget.spent)}</span>
                <span>Limit: {BudgetService.formatCurrency(budget.limit)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(budget.status)}`}
                  style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>{budget.percentage}% used</span>
                <span>{BudgetService.formatCurrency(budget.remaining)} remaining</span>
              </div>
            </div>

            {/* Status Message */}
            <div className={`text-sm p-3 rounded-lg ${
              budget.status === 'exceeded' 
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                : budget.status === 'warning'
                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            }`}>
              {budget.status === 'exceeded' && (
                <span>⚠️ Budget exceeded! You've spent {BudgetService.formatCurrency(budget.spent - budget.limit)} over your limit.</span>
              )}
              {budget.status === 'warning' && (
                <span>⚠️ Approaching budget limit. You have {BudgetService.formatCurrency(budget.remaining)} left for this {budget.period}.</span>
              )}
              {budget.status === 'safe' && (
                <span>✅ You're on track! {BudgetService.formatCurrency(budget.remaining)} remaining for this {budget.period}.</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BudgetProgressCard;
