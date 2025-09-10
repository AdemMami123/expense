import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BudgetService } from '../../lib/budget-service';
import type { BudgetLimit, BudgetAlert, BudgetProgress, BudgetFormData } from '../../types/budget';
import BudgetForm from './BudgetForm';
import BudgetProgressCard from './BudgetProgress';
import BudgetAlerts from './BudgetAlerts';

const BudgetManager: React.FC = () => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<BudgetLimit[]>([]);
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgress[]>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetLimit | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'manage'>('overview');

  // Load budget data
  const loadBudgetData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [budgetsData, progressData, alertsData] = await Promise.all([
        BudgetService.getBudgets(user.id),
        BudgetService.getBudgetProgress(user.id),
        BudgetService.getAlerts(user.id)
      ]);

      setBudgets(budgetsData);
      setBudgetProgress(progressData);
      setAlerts(alertsData);

      // Check for new alerts
      await BudgetService.checkBudgetsAndCreateAlerts(user.id);
      
      // Reload alerts after checking
      const updatedAlerts = await BudgetService.getAlerts(user.id);
      setAlerts(updatedAlerts);
    } catch (error) {
      console.error('Error loading budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgetData();
  }, [user]);

  const handleCreateBudget = async (budgetData: BudgetFormData) => {
    if (!user) return;

    try {
      await BudgetService.createBudget(user.id, budgetData);
      await loadBudgetData();
      setShowForm(false);
      setActiveTab('overview');
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  };

  const handleUpdateBudget = async (budgetData: BudgetFormData) => {
    if (!user || !editingBudget) return;

    try {
      await BudgetService.updateBudget(editingBudget.id, budgetData);
      await loadBudgetData();
      setEditingBudget(null);
      setShowForm(false);
      setActiveTab('overview');
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      await BudgetService.deleteBudget(budgetId);
      await loadBudgetData();
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  const handleEditBudget = (budgetId: string) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (budget) {
      setEditingBudget(budget);
      setShowForm(true);
      setActiveTab('create');
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      await BudgetService.dismissAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const handleTabChange = (tab: 'overview' | 'create' | 'manage') => {
    setActiveTab(tab);
    if (tab !== 'create') {
      setShowForm(false);
      setEditingBudget(null);
    } else {
      setShowForm(true);
    }
  };

  if (loading && budgets.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Budget Management
        </h2>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => handleTabChange('create')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {editingBudget ? 'Edit Budget' : 'Create Budget'}
          </button>
          <button
            onClick={() => handleTabChange('manage')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'manage'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Manage Budgets ({budgets.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Alerts */}
          {alerts.length > 0 && (
            <BudgetAlerts alerts={alerts} onDismissAlert={handleDismissAlert} />
          )}

          {/* Budget Progress */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Current Budget Status
            </h3>
            <BudgetProgressCard
              budgets={budgetProgress}
              onEditBudget={handleEditBudget}
              onDeleteBudget={handleDeleteBudget}
            />
          </div>

          {/* Quick Actions */}
          {budgets.length === 0 && (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No budgets yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating your first budget to track spending limits.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => handleTabChange('create')}
                  className="btn-primary"
                >
                  Create Your First Budget
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <BudgetForm
          onSubmit={editingBudget ? handleUpdateBudget : handleCreateBudget}
          onCancel={() => {
            setShowForm(false);
            setEditingBudget(null);
            setActiveTab('overview');
          }}
          initialData={editingBudget || undefined}
          isEditing={!!editingBudget}
        />
      )}

      {activeTab === 'manage' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              All Budgets ({budgets.length})
            </h3>
            <button
              onClick={() => handleTabChange('create')}
              className="btn-primary"
            >
              Create New Budget
            </button>
          </div>
          
          <BudgetProgressCard
            budgets={budgetProgress}
            onEditBudget={handleEditBudget}
            onDeleteBudget={handleDeleteBudget}
          />
        </div>
      )}
    </div>
  );
};

export default BudgetManager;
