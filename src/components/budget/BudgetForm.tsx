import React, { useState } from 'react';
import type { BudgetFormData } from '../../types/budget';
import { EXPENSE_CATEGORIES } from '../../types/expense';

interface BudgetFormProps {
  onSubmit: (budgetData: BudgetFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<BudgetFormData>;
  isEditing?: boolean;
}

const BudgetForm: React.FC<BudgetFormProps> = ({ 
  onSubmit, 
  onCancel, 
  initialData,
  isEditing = false 
}) => {
  const [formData, setFormData] = useState<BudgetFormData>({
    name: initialData?.name || '',
    amount: initialData?.amount || 0,
    period: initialData?.period || 'monthly',
    category: initialData?.category || '',
    warningThreshold: initialData?.warningThreshold || 80,
    enabled: initialData?.enabled ?? true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Budget name is required';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (formData.warningThreshold < 1 || formData.warningThreshold > 100) {
      newErrors.warningThreshold = 'Warning threshold must be between 1 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      if (!isEditing) {
        // Reset form after successful creation
        setFormData({
          name: '',
          amount: 0,
          period: 'monthly',
          category: '',
          warningThreshold: 80,
          enabled: true
        });
      }
    } catch (error) {
      console.error('Error submitting budget:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BudgetFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="card fade-in">
      <div className="card-header">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {isEditing ? 'Edit Budget' : 'Create New Budget'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="card-body space-y-6">
        {/* Budget Name */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Budget Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`input-field ${errors.name ? 'border-red-500 ring-red-500 ring-opacity-50' : ''}`}
            placeholder="e.g., Monthly Groceries, Weekly Entertainment"
            disabled={loading}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-2 flex items-center">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {errors.name}
            </p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Budget Amount ($) *
          </label>
          <input
            type="number"
            id="amount"
            value={formData.amount || ''}
            onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
            className={`input-field ${errors.amount ? 'border-red-500' : ''}`}
            placeholder="0.00"
            min="0"
            step="0.01"
            disabled={loading}
          />
          {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
        </div>

        {/* Period */}
        <div>
          <label htmlFor="period" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Time Period *
          </label>
          <select
            id="period"
            value={formData.period}
            onChange={(e) => handleInputChange('period', e.target.value as any)}
            className="input-field"
            disabled={loading}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category (Optional)
          </label>
          <select
            id="category"
            value={formData.category || ''}
            onChange={(e) => handleInputChange('category', e.target.value || undefined)}
            className="input-field"
            disabled={loading}
          >
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Leave empty to apply to all expenses
          </p>
        </div>

        {/* Warning Threshold */}
        <div>
          <label htmlFor="warningThreshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Warning Threshold (%) *
          </label>
          <input
            type="number"
            id="warningThreshold"
            value={formData.warningThreshold}
            onChange={(e) => handleInputChange('warningThreshold', parseInt(e.target.value) || 80)}
            className={`input-field ${errors.warningThreshold ? 'border-red-500' : ''}`}
            min="1"
            max="100"
            disabled={loading}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Get warned when you reach this percentage of your budget
          </p>
          {errors.warningThreshold && <p className="text-red-500 text-sm mt-1">{errors.warningThreshold}</p>}
        </div>

        {/* Enabled Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enabled"
            checked={formData.enabled}
            onChange={(e) => handleInputChange('enabled', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={loading}
          />
          <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Enable this budget
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditing ? 'Update Budget' : 'Create Budget')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BudgetForm;
