import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../lib/auth-actions';
import { ExpenseService } from '../lib/expense-service';
import { pwaUtils } from '../lib/pwa-utils';
import type { Expense, ExpenseFormData, ExpenseStats } from '../types/expense';
import Navigation, { type TabType } from './common/Navigation';
import SyncStatus from './common/SyncStatus';
import DarkModeToggle from './common/DarkModeToggle';
import ExportMenu from './common/ExportMenu';
import ExpenseForm from './expenses/ExpenseForm';
import ExpenseList from './expenses/ExpenseList';
import Dashboard from './dashboard/Dashboard';
import InstallPrompt from './pwa/InstallPrompt';
import OfflineIndicator from './pwa/OfflineIndicator';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('expenses');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats>({
    totalExpenses: 0,
    dailyTotal: 0,
    weeklyTotal: 0,
    monthlyTotal: 0,
    categoryTotals: {}
  });
  const [syncStatus, setSyncStatus] = useState({
    unsyncedCount: 0,
    isOnline: navigator.onLine
  });
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // Load expenses and stats
  const loadData = async () => {
    if (!user) return;

    try {
      setExpenseLoading(true);
      setStatsLoading(true);

      const [expensesData, statsData, syncStatusData] = await Promise.all([
        ExpenseService.getExpenses(user.id),
        ExpenseService.getExpenseStats(user.id),
        ExpenseService.getSyncStatus(user.id)
      ]);

      setExpenses(expensesData);
      setStats(statsData);
      setSyncStatus(syncStatusData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setExpenseLoading(false);
      setStatsLoading(false);
    }
  };

  // Initialize PWA, sync and load data
  useEffect(() => {
    // Initialize PWA features
    const initPWA = async () => {
      await pwaUtils.registerServiceWorker();
      await pwaUtils.requestPersistentStorage();
    };
    initPWA();

    if (user) {
      ExpenseService.initializeSync(user.id, loadData);
      loadData();
    }

    // Listen for online/offline events
    const handleOnline = async () => {
      console.log('Device came back online, triggering sync...');
      setSyncStatus(prev => ({ ...prev, isOnline: true }));

      // Trigger sync when coming back online
      if (user) {
        try {
          await ExpenseService.manualSync(user.id);
          await loadData(); // Refresh data after sync
          console.log('Auto-sync completed successfully');
        } catch (error) {
          console.error('Auto-sync failed:', error);
        }
      }
    };

    const handleOffline = () => {
      console.log('Device went offline');
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      ExpenseService.cleanup();
    };
  }, [user]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (expenseData: ExpenseFormData) => {
    if (!user) return;

    try {
      await ExpenseService.addExpense(user.id, expenseData);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await ExpenseService.deleteExpense(expenseId);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  };

  const handleManualSync = async () => {
    if (!user) return;

    try {
      await ExpenseService.manualSync(user.id);
      await loadData(); // Refresh data after sync
    } catch (error) {
      console.error('Manual sync error:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Expense Tracker
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <SyncStatus
                unsyncedCount={syncStatus.unsyncedCount}
                isOnline={syncStatus.isOnline}
                onManualSync={handleManualSync}
              />
              <ExportMenu expenses={expenses} />
              <DarkModeToggle />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {user?.name}
              </span>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                {loading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <ExpenseForm onSubmit={handleAddExpense} />
            <ExpenseList
              expenses={expenses}
              onDelete={handleDeleteExpense}
              loading={expenseLoading}
            />
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard stats={stats} expenses={expenses} loading={statsLoading} />
        )}
      </main>

      {/* PWA Components */}
      <InstallPrompt />
      <OfflineIndicator />
    </div>
  );
};

export default MainApp;
