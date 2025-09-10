import { v4 as uuidv4 } from 'uuid';
import { ExpenseDB } from './database';
import { SyncService } from './sync-service';
import { Expense, ExpenseFormData, ExpenseStats } from '../types/expense';

export class ExpenseService {
  // Add a new expense
  static async addExpense(
    userId: string, 
    expenseData: ExpenseFormData
  ): Promise<Expense> {
    try {
      const now = new Date().toISOString();
      const expense: Expense = {
        id: uuidv4(),
        userId,
        amount: expenseData.amount,
        category: expenseData.category,
        description: expenseData.description,
        date: expenseData.date,
        createdAt: now,
        updatedAt: now,
        synced: false
      };

      // Add to local database first
      await ExpenseDB.addExpense(expense);

      // Try to sync to Firebase if online
      if (SyncService.isOnline()) {
        try {
          await SyncService.syncToFirebase(userId);
        } catch (error) {
          console.warn('Failed to sync to Firebase, will retry later:', error);
        }
      }

      return expense;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  // Get all expenses for a user
  static async getExpenses(userId: string): Promise<Expense[]> {
    try {
      return await ExpenseDB.getExpenses(userId);
    } catch (error) {
      console.error('Error getting expenses:', error);
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
      return await ExpenseDB.getExpensesByDateRange(userId, startDate, endDate);
    } catch (error) {
      console.error('Error getting expenses by date range:', error);
      throw error;
    }
  }

  // Update an expense
  static async updateExpense(
    expenseId: string,
    updates: Partial<ExpenseFormData>
  ): Promise<void> {
    try {
      const updateData: Partial<Expense> = {
        ...updates,
        updatedAt: new Date().toISOString(),
        synced: false // Mark as unsynced since it was modified
      };

      await ExpenseDB.updateExpense(expenseId, updateData);

      // Try to sync to Firebase if online
      if (SyncService.isOnline()) {
        try {
          const expense = await this.getExpenseById(expenseId);
          if (expense) {
            await SyncService.syncToFirebase(expense.userId);
          }
        } catch (error) {
          console.warn('Failed to sync updated expense to Firebase:', error);
        }
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  // Delete an expense
  static async deleteExpense(expenseId: string): Promise<void> {
    try {
      await SyncService.deleteExpense(expenseId);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  // Get expense by ID
  static async getExpenseById(expenseId: string): Promise<Expense | null> {
    try {
      const expenses = await ExpenseDB.getExpenses(''); // We'll filter by ID
      return expenses.find(e => e.id === expenseId) || null;
    } catch (error) {
      console.error('Error getting expense by ID:', error);
      return null;
    }
  }

  // Get expense statistics
  static async getExpenseStats(userId: string): Promise<ExpenseStats> {
    try {
      const stats = await ExpenseDB.getExpenseStats(userId);
      return {
        totalExpenses: stats.totalExpenses,
        dailyTotal: stats.dailyTotal,
        weeklyTotal: stats.weeklyTotal,
        monthlyTotal: stats.monthlyTotal,
        categoryTotals: stats.categoryTotals
      };
    } catch (error) {
      console.error('Error getting expense stats:', error);
      throw error;
    }
  }

  // Initialize sync for a user
  static async initializeSync(userId: string, onUpdate?: () => void): Promise<void> {
    try {
      // Initial sync from Firebase
      if (SyncService.isOnline()) {
        await SyncService.fullSync(userId);
      }

      // Setup auto-sync and realtime listeners
      SyncService.setupAutoSync(userId, onUpdate);
    } catch (error) {
      console.error('Error initializing sync:', error);
      throw error;
    }
  }

  // Manual sync trigger
  static async manualSync(userId: string): Promise<void> {
    try {
      if (!SyncService.isOnline()) {
        throw new Error('Cannot sync while offline');
      }

      await SyncService.fullSync(userId);
    } catch (error) {
      console.error('Error during manual sync:', error);
      throw error;
    }
  }

  // Get sync status
  static async getSyncStatus(userId: string): Promise<{
    unsyncedCount: number;
    isOnline: boolean;
  }> {
    try {
      const unsyncedExpenses = await ExpenseDB.getUnsyncedExpenses(userId);
      return {
        unsyncedCount: unsyncedExpenses.length,
        isOnline: SyncService.isOnline()
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        unsyncedCount: 0,
        isOnline: false
      };
    }
  }

  // Cleanup
  static cleanup(): void {
    SyncService.cleanup();
  }
}
