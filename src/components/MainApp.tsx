import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../lib/auth-actions';
import { ExpenseService } from '../lib/expense-service';
import { BudgetService } from '../lib/budget-service';
import { pwaUtils } from '../lib/pwa-utils';
import type { Expense, ExpenseFormData, ExpenseStats } from '../types/expense';
import type { BudgetAlert } from '../types/budget';
import Navigation, { type TabType } from './common/Navigation';
import SyncStatus from './common/SyncStatus';
import DarkModeToggle from './common/DarkModeToggle';
import ExportMenu from './common/ExportMenu';
import ExpenseForm from './expenses/ExpenseForm';
import ExpenseList from './expenses/ExpenseList';
import Dashboard from './dashboard/Dashboard';
import BudgetManager from './budget/BudgetManager';
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
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);

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

      // Check budget alerts after loading expenses
      await checkBudgetAlerts();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setExpenseLoading(false);
      setStatsLoading(false);
    }
  };

  // Check for budget alerts
  const checkBudgetAlerts = async () => {
    if (!user) return;

    try {
      const newAlerts = await BudgetService.checkBudgetsAndCreateAlerts(user.id);
      if (newAlerts.length > 0) {
        const allAlerts = await BudgetService.getAlerts(user.id);
        setBudgetAlerts(allAlerts);
      }
    } catch (error) {
      console.error('Error checking budget alerts:', error);
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
      await loadData(); // Refresh data and check budget alerts
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl shadow-lg mr-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Expense Tracker
              </h1>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:block">
                <SyncStatus
                  unsyncedCount={syncStatus.unsyncedCount}
                  isOnline={syncStatus.isOnline}
                  onManualSync={handleManualSync}
                  userId={user?.id}
                />
              </div>
              <div className="hidden md:block">
                <ExportMenu expenses={expenses} />
              </div>
              <DarkModeToggle />
              <div className="hidden lg:block">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome, {user?.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                    <span className="hidden sm:inline">Logging out...</span>
                  </div>
                ) : (
                  <span>Logout</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 fade-in">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200/50 dark:border-yellow-800/50 rounded-xl p-4 sm:p-6 shadow-lg backdrop-blur-sm">
            <div className="flex items-start">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-lg">
                <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                  Budget Alert{budgetAlerts.length > 1 ? 's' : ''}
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  {budgetAlerts.slice(0, 2).map(alert => (
                    <p key={alert.id} className="leading-relaxed">{alert.message}</p>
                  ))}
                  {budgetAlerts.length > 2 && (
                    <p className="text-xs font-medium">And {budgetAlerts.length - 2} more alerts...</p>
                  )}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setActiveTab('budgets')}
                    className="inline-flex items-center text-sm font-semibold text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 transition-colors duration-200"
                  >
                    View Budget Details
                    <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
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
          <Dashboard
            stats={stats}
            expenses={expenses}
            loading={statsLoading}
            onNavigateToBudgets={() => setActiveTab('budgets')}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetManager />
        )}
      </main>

      {/* PWA Components */}
      <InstallPrompt />
      <OfflineIndicator />
    </div>
  );
};

export default MainApp;
