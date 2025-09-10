import Dexie, { Table } from 'dexie';
import { Expense } from '../types/expense';
import type { BudgetLimit, BudgetAlert } from '../types/budget';

export class ExpenseDatabase extends Dexie {
  expenses!: Table<Expense>;
  budgets!: Table<BudgetLimit>;
  alerts!: Table<BudgetAlert>;

  constructor() {
    super('ExpenseTrackerDB');

    this.version(1).stores({
      expenses: 'id, userId, amount, category, date, createdAt, synced'
    });

    // Version 2: Add budget tables
    this.version(2).stores({
      expenses: 'id, userId, amount, category, date, createdAt, synced',
      budgets: 'id, userId, period, category, enabled, createdAt, synced',
      alerts: 'id, budgetId, userId, type, createdAt, dismissed'
    });
  }
}

export const db = new ExpenseDatabase();

// Database operations
export class ExpenseDB {
  // Add a new expense
  static async addExpense(expense: Expense): Promise<string> {
    try {
      await db.expenses.add(expense);
      return expense.id;
    } catch (error) {
      console.error('Error adding expense to IndexedDB:', error);
      throw error;
    }
  }

  // Get all expenses for a user
  static async getExpenses(userId: string): Promise<Expense[]> {
    try {
      return await db.expenses
        .where('userId')
        .equals(userId)
        .reverse()
        .reverse()
        .toArray();
    } catch (error) {
      console.error('Error getting expenses from IndexedDB:', error);
      throw error;
    }
  }

  // Get expenses by date range
  static async getExpensesByDateRange(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<Expense[]> {
    try {
      return await db.expenses
        .where('userId')
        .equals(userId)
        .and(expense => expense.date >= startDate && expense.date <= endDate)
        .reverse()
        .reverse()
        .toArray();
    } catch (error) {
      console.error('Error getting expenses by date range from IndexedDB:', error);
      throw error;
    }
  }

  // Get unsynced expenses
  static async getUnsyncedExpenses(userId: string): Promise<Expense[]> {
    try {
      return await db.expenses
        .where('userId')
        .equals(userId)
        .and(expense => !expense.synced)
        .toArray();
    } catch (error) {
      console.error('Error getting unsynced expenses from IndexedDB:', error);
      throw error;
    }
  }

  // Update an expense
  static async updateExpense(id: string, updates: Partial<Expense>): Promise<void> {
    try {
      await db.expenses.update(id, updates);
    } catch (error) {
      console.error('Error updating expense in IndexedDB:', error);
      throw error;
    }
  }

  // Mark expense as synced
  static async markAsSynced(id: string): Promise<void> {
    try {
      await db.expenses.update(id, { synced: true });
    } catch (error) {
      console.error('Error marking expense as synced in IndexedDB:', error);
      throw error;
    }
  }

  // Delete an expense
  static async deleteExpense(id: string): Promise<void> {
    try {
      await db.expenses.delete(id);
    } catch (error) {
      console.error('Error deleting expense from IndexedDB:', error);
      throw error;
    }
  }

  // Clear all expenses for a user
  static async clearUserExpenses(userId: string): Promise<void> {
    try {
      await db.expenses.where('userId').equals(userId).delete();
    } catch (error) {
      console.error('Error clearing user expenses from IndexedDB:', error);
      throw error;
    }
  }

  // Get expense statistics
  static async getExpenseStats(userId: string): Promise<{
    totalExpenses: number;
    dailyTotal: number;
    weeklyTotal: number;
    monthlyTotal: number;
    categoryTotals: Record<string, number>;
  }> {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Calculate week start (Monday)
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      
      // Calculate month start
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      const allExpenses = await this.getExpenses(userId);
      const dailyExpenses = allExpenses.filter(e => e.date.startsWith(today));
      const weeklyExpenses = allExpenses.filter(e => e.date >= weekStartStr);
      const monthlyExpenses = allExpenses.filter(e => e.date >= monthStartStr);

      const categoryTotals: Record<string, number> = {};
      allExpenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
      });

      return {
        totalExpenses: allExpenses.length,
        dailyTotal: dailyExpenses.reduce((sum, e) => sum + e.amount, 0),
        weeklyTotal: weeklyExpenses.reduce((sum, e) => sum + e.amount, 0),
        monthlyTotal: monthlyExpenses.reduce((sum, e) => sum + e.amount, 0),
        categoryTotals
      };
    } catch (error) {
      console.error('Error getting expense stats from IndexedDB:', error);
      throw error;
    }
  }
}

// Budget Database operations
export class BudgetDB {
  // Budget CRUD operations
  static async addBudget(budget: BudgetLimit): Promise<void> {
    try {
      await db.budgets.add(budget);
    } catch (error) {
      console.error('Error adding budget to IndexedDB:', error);
      throw error;
    }
  }

  static async getBudgets(userId: string): Promise<BudgetLimit[]> {
    try {
      return await db.budgets
        .where('userId')
        .equals(userId)
        .reverse()
        .toArray();
    } catch (error) {
      console.error('Error getting budgets from IndexedDB:', error);
      throw error;
    }
  }

  static async getBudgetById(id: string): Promise<BudgetLimit | undefined> {
    try {
      return await db.budgets.get(id);
    } catch (error) {
      console.error('Error getting budget by ID from IndexedDB:', error);
      throw error;
    }
  }

  static async updateBudget(id: string, updates: Partial<BudgetLimit>): Promise<void> {
    try {
      await db.budgets.update(id, {
        ...updates,
        updatedAt: new Date().toISOString(),
        synced: false
      });
    } catch (error) {
      console.error('Error updating budget in IndexedDB:', error);
      throw error;
    }
  }

  static async deleteBudget(id: string): Promise<void> {
    try {
      await db.budgets.delete(id);
      // Also delete related alerts
      await db.alerts.where('budgetId').equals(id).delete();
    } catch (error) {
      console.error('Error deleting budget from IndexedDB:', error);
      throw error;
    }
  }

  static async getActiveBudgets(userId: string): Promise<BudgetLimit[]> {
    try {
      return await db.budgets
        .where('userId')
        .equals(userId)
        .and(budget => budget.enabled)
        .toArray();
    } catch (error) {
      console.error('Error getting active budgets from IndexedDB:', error);
      throw error;
    }
  }

  static async getUnsyncedBudgets(userId: string): Promise<BudgetLimit[]> {
    try {
      return await db.budgets
        .where('userId')
        .equals(userId)
        .and(budget => !budget.synced)
        .toArray();
    } catch (error) {
      console.error('Error getting unsynced budgets from IndexedDB:', error);
      throw error;
    }
  }

  static async markBudgetAsSynced(id: string): Promise<void> {
    try {
      await db.budgets.update(id, { synced: true });
    } catch (error) {
      console.error('Error marking budget as synced in IndexedDB:', error);
      throw error;
    }
  }

  // Alert CRUD operations
  static async addAlert(alert: BudgetAlert): Promise<void> {
    try {
      await db.alerts.add(alert);
    } catch (error) {
      console.error('Error adding alert to IndexedDB:', error);
      throw error;
    }
  }

  static async getAlerts(userId: string): Promise<BudgetAlert[]> {
    try {
      return await db.alerts
        .where('userId')
        .equals(userId)
        .and(alert => !alert.dismissed)
        .reverse()
        .toArray();
    } catch (error) {
      console.error('Error getting alerts from IndexedDB:', error);
      throw error;
    }
  }

  static async dismissAlert(id: string): Promise<void> {
    try {
      await db.alerts.update(id, { dismissed: true });
    } catch (error) {
      console.error('Error dismissing alert in IndexedDB:', error);
      throw error;
    }
  }

  static async clearOldAlerts(userId: string, daysOld: number = 7): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      await db.alerts
        .where('userId')
        .equals(userId)
        .and(alert => new Date(alert.createdAt) < cutoffDate)
        .delete();
    } catch (error) {
      console.error('Error clearing old alerts from IndexedDB:', error);
      throw error;
    }
  }

  static async getRecentAlert(budgetId: string, type: string, hoursRecent: number = 24): Promise<BudgetAlert | undefined> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - hoursRecent);

      return await db.alerts
        .where('budgetId')
        .equals(budgetId)
        .and(alert =>
          alert.type === type &&
          !alert.dismissed &&
          new Date(alert.createdAt) > cutoffDate
        )
        .first();
    } catch (error) {
      console.error('Error getting recent alert from IndexedDB:', error);
      throw error;
    }
  }
}
