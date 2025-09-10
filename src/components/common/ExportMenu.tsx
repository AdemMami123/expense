import React, { useState } from 'react';
import { Expense } from '../../types/expense';
import { CSVExport } from '../../lib/csv-export';

interface ExportMenuProps {
  expenses: Expense[];
}

const ExportMenu: React.FC<ExportMenuProps> = ({ expenses }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  const handleExportAll = () => {
    CSVExport.exportExpenses(expenses);
    setIsOpen(false);
  };

  const handleExportSummary = () => {
    CSVExport.exportExpenseSummary(expenses);
    setIsOpen(false);
  };

  const handleExportDateRange = () => {
    if (!dateRange.start || !dateRange.end) {
      alert('Please select both start and end dates');
      return;
    }
    
    CSVExport.exportExpensesByDateRange(expenses, dateRange.start, dateRange.end);
    setIsOpen(false);
  };

  const handleExportCategory = (category: string) => {
    CSVExport.exportExpensesByCategory(expenses, category);
    setIsOpen(false);
  };

  // Get unique categories from expenses
  const categories = Array.from(new Set(expenses.map(e => e.category)));

  if (expenses.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary flex items-center space-x-2"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Export</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Export Expenses
              </h3>
              
              <div className="space-y-3">
                {/* Export All */}
                <button
                  onClick={handleExportAll}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    All Expenses
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Export all {expenses.length} expenses
                  </div>
                </button>

                {/* Export Summary */}
                <button
                  onClick={handleExportSummary}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    Summary Report
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Export summary with category totals
                  </div>
                </button>

                {/* Date Range Export */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <div className="font-medium text-gray-900 dark:text-white mb-2">
                    Date Range
                  </div>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="input-field text-sm"
                      placeholder="Start date"
                    />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="input-field text-sm"
                      placeholder="End date"
                    />
                    <button
                      onClick={handleExportDateRange}
                      disabled={!dateRange.start || !dateRange.end}
                      className="btn-primary w-full text-sm disabled:opacity-50"
                    >
                      Export Date Range
                    </button>
                  </div>
                </div>

                {/* Category Export */}
                {categories.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <div className="font-medium text-gray-900 dark:text-white mb-2">
                      By Category
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {categories.map(category => (
                        <button
                          key={category}
                          onClick={() => handleExportCategory(category)}
                          className="w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportMenu;
