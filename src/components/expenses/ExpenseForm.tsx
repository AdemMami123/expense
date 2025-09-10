import React, { useState } from 'react';
import { ExpenseFormData, EXPENSE_CATEGORIES } from '../../types/expense';

interface ExpenseFormProps {
  onSubmit: (expense: ExpenseFormData) => Promise<void>;
  loading?: boolean;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: 0,
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0] // Today's date
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (!formData.category) {
      setError('Please select a category');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please enter a description');
      return;
    }

    try {
      await onSubmit(formData);
      
      // Reset form after successful submission
      setFormData({
        amount: 0,
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      setError('Failed to add expense. Please try again.');
    }
  };

  return (
    <div className="card fade-in">
      <div className="card-header">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Expense</h2>
      </div>

      <div className="card-body">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6 slide-up">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Amount ($) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 text-lg">$</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount || ''}
                  onChange={handleChange}
                  className="input-field pl-8"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-1">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="">Select a category</option>
            {EXPENSE_CATEGORIES.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="input-field"
            placeholder="Enter expense description..."
            rows={3}
            required
          />
        </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Adding Expense...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Expense</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;
