import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BudgetService } from '../../lib/budget-service';
import type { BudgetProgress } from '../../types/budget';

interface BudgetSummaryProps {
  onViewBudgets?: () => void;
}

const BudgetSummary: React.FC<BudgetSummaryProps> = ({ onViewBudgets }) => {
  const { user } = useAuth();
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgress[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadBudgetProgress = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const progress = await BudgetService.getBudgetProgress(user.id);
        setBudgetProgress(progress);
      } catch (error) {
        console.error('Error loading budget progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBudgetProgress();
  }, [user]);

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Budget Status</h3>
        </div>
        <div className="card-body">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (budgetProgress.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Budget Status</h3>
        </div>
        <div className="card-body text-center py-6">
          <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No budgets set up yet
          </p>
          {onViewBudgets && (
            <button
              onClick={onViewBudgets}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Create your first budget →
            </button>
          )}
        </div>
      </div>
    );
  }

  const exceededBudgets = budgetProgress.filter(b => b.status === 'exceeded');
  const warningBudgets = budgetProgress.filter(b => b.status === 'warning');
  const safeBudgets = budgetProgress.filter(b => b.status === 'safe');

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Budget Status</h3>
        {onViewBudgets && (
          <button
            onClick={onViewBudgets}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View All
          </button>
        )}
      </div>
      <div className="card-body space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {exceededBudgets.length}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400">Exceeded</div>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {warningBudgets.length}
            </div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400">Warning</div>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {safeBudgets.length}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">On Track</div>
          </div>
        </div>

        {/* Top 3 Budget Items */}
        <div className="space-y-3">
          {budgetProgress.slice(0, 3).map((budget) => (
            <div key={budget.budgetId} className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    budget.status === 'exceeded' ? 'bg-red-500' :
                    budget.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {budget.budgetName}
                  </span>
                </div>
                <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      budget.status === 'exceeded' ? 'bg-red-500' :
                      budget.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="ml-4 text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {budget.percentage}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {BudgetService.formatCurrency(budget.remaining)} left
                </div>
              </div>
            </div>
          ))}
          
          {budgetProgress.length > 3 && (
            <div className="text-center pt-2">
              <button
                onClick={onViewBudgets}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                View {budgetProgress.length - 3} more budgets...
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetSummary;
