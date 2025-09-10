import React, { useState } from 'react';
import { ExpenseStats, Expense } from '../../types/expense';
import CategoryPieChart from '../charts/CategoryPieChart';
import SpendingBarChart from '../charts/SpendingBarChart';
import BudgetSummary from '../budget/BudgetSummary';

interface DashboardProps {
  stats: ExpenseStats;
  expenses: Expense[];
  loading?: boolean;
  onNavigateToBudgets?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, expenses, loading = false, onNavigateToBudgets }) => {
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly'>('daily');
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card">
            <div className="card-body">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Today',
      amount: stats.dailyTotal,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'This Week',
      amount: stats.weeklyTotal,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'This Month',
      amount: stats.monthlyTotal,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Total Expenses',
      amount: stats.totalExpenses,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'text-orange-600 dark:text-orange-400',
      isCount: true
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="card-body">
              <div className="flex items-center">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${
                  stat.color.includes('blue') ? 'from-blue-500 to-blue-600' :
                  stat.color.includes('green') ? 'from-green-500 to-green-600' :
                  stat.color.includes('purple') ? 'from-purple-500 to-purple-600' :
                  'from-orange-500 to-orange-600'
                } shadow-lg`}>
                  <div className="text-white">
                    {stat.icon}
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.isCount ? stat.amount : formatAmount(stat.amount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <CategoryPieChart categoryTotals={stats.categoryTotals} />

        {/* Spending Trends Bar Chart */}
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Spending Trends</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setChartPeriod('daily')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    chartPeriod === 'daily'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setChartPeriod('weekly')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    chartPeriod === 'weekly'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Weekly
                </button>
              </div>
            </div>
            <div className="h-64">
              <SpendingBarChart
                expenses={expenses}
                period={chartPeriod}
                title=""
              />
            </div>
          </div>
        </div>
      </div>

      {/* Budget Summary */}
      <BudgetSummary onViewBudgets={onNavigateToBudgets} />

      {/* Category Breakdown Table */}
      {Object.keys(stats.categoryTotals).length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(stats.categoryTotals)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => {
                const percentage = stats.monthlyTotal > 0
                  ? (amount / stats.monthlyTotal) * 100
                  : 0;

                return (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white min-w-0 flex-1">
                        {category}
                      </span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-32">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatAmount(amount)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
