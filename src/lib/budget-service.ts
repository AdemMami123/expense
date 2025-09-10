import { v4 as uuidv4 } from 'uuid';
import { BudgetDB, ExpenseDB } from './database';
import type { BudgetLimit, BudgetAlert, BudgetProgress, BudgetFormData } from '../types/budget';
import type { Expense } from '../types/expense';

export class BudgetService {
  // Create a new budget
  static async createBudget(userId: string, budgetData: BudgetFormData): Promise<BudgetLimit> {
    try {
      const now = new Date().toISOString();
      const budget: BudgetLimit = {
        id: uuidv4(),
        userId,
        name: budgetData.name,
        amount: budgetData.amount,
        period: budgetData.period,
        category: budgetData.category,
        enabled: budgetData.enabled,
        warningThreshold: budgetData.warningThreshold,
        createdAt: now,
        updatedAt: now,
        synced: false
      };

      await BudgetDB.addBudget(budget);
      return budget;
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  }

  // Get all budgets for a user
  static async getBudgets(userId: string): Promise<BudgetLimit[]> {
    try {
      return await BudgetDB.getBudgets(userId);
    } catch (error) {
      console.error('Error getting budgets:', error);
      throw error;
    }
  }

  // Update a budget
  static async updateBudget(budgetId: string, updates: Partial<BudgetFormData>): Promise<void> {
    try {
      await BudgetDB.updateBudget(budgetId, updates);
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  }

  // Delete a budget
  static async deleteBudget(budgetId: string): Promise<void> {
    try {
      await BudgetDB.deleteBudget(budgetId);
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  }

  // Calculate current spending for a budget period
  static calculateCurrentSpending(expenses: Expense[], budget: BudgetLimit): number {
    const now = new Date();
    let startDate: Date;
    
    switch (budget.period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    const relevantExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const matchesDate = expenseDate >= startDate && expenseDate <= now;
      const matchesCategory = !budget.category || expense.category === budget.category;
      return matchesDate && matchesCategory;
    });
    
    return relevantExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  // Calculate days left in the current period
  static calculateDaysLeft(period: string): number {
    const now = new Date();
    let endDate: Date;
    
    switch (period) {
      case 'daily':
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'weekly':
        endDate = new Date(now);
        endDate.setDate(now.getDate() + (6 - now.getDay())); // End of week (Saturday)
        break;
      case 'monthly':
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'yearly':
        endDate = new Date(now.getFullYear() + 1, 0, 0);
        break;
      default:
        return 0;
    }
    
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Get budget progress for all active budgets
  static async getBudgetProgress(userId: string): Promise<BudgetProgress[]> {
    try {
      const [budgets, expenses] = await Promise.all([
        BudgetDB.getActiveBudgets(userId),
        ExpenseDB.getExpenses(userId)
      ]);

      return budgets.map(budget => {
        const spent = this.calculateCurrentSpending(expenses, budget);
        const remaining = Math.max(0, budget.amount - spent);
        const percentage = (spent / budget.amount) * 100;
        const daysLeft = this.calculateDaysLeft(budget.period);
        
        let status: 'safe' | 'warning' | 'exceeded' = 'safe';
        if (percentage >= 100) {
          status = 'exceeded';
        } else if (percentage >= budget.warningThreshold) {
          status = 'warning';
        }

        return {
          budgetId: budget.id,
          budgetName: budget.name,
          period: budget.period,
          category: budget.category,
          spent,
          limit: budget.amount,
          remaining,
          percentage: Math.round(percentage),
          daysLeft,
          status,
          warningThreshold: budget.warningThreshold
        };
      });
    } catch (error) {
      console.error('Error getting budget progress:', error);
      throw error;
    }
  }

  // Check budgets and create alerts if needed
  static async checkBudgetsAndCreateAlerts(userId: string): Promise<BudgetAlert[]> {
    try {
      const budgetProgress = await this.getBudgetProgress(userId);
      const newAlerts: BudgetAlert[] = [];

      for (const progress of budgetProgress) {
        const budget = await BudgetDB.getBudgetById(progress.budgetId);
        if (!budget) continue;

        // Check if we need to create an alert
        let alertType: 'warning' | 'exceeded' | 'approaching' | null = null;
        
        if (progress.percentage >= 100) {
          alertType = 'exceeded';
        } else if (progress.percentage >= progress.warningThreshold) {
          alertType = 'warning';
        } else if (progress.percentage >= progress.warningThreshold - 10) {
          alertType = 'approaching';
        }

        if (alertType) {
          // Check if we already have a recent alert of this type
          const recentAlert = await BudgetDB.getRecentAlert(budget.id, alertType, 24);
          
          if (!recentAlert) {
            const alert: BudgetAlert = {
              id: uuidv4(),
              budgetId: budget.id,
              userId,
              type: alertType,
              message: this.generateAlertMessage(budget, progress),
              currentAmount: progress.spent,
              budgetAmount: progress.limit,
              percentage: progress.percentage,
              period: budget.period,
              category: budget.category,
              createdAt: new Date().toISOString(),
              dismissed: false
            };
            
            await BudgetDB.addAlert(alert);
            newAlerts.push(alert);
          }
        }
      }

      return newAlerts;
    } catch (error) {
      console.error('Error checking budgets and creating alerts:', error);
      throw error;
    }
  }

  // Generate alert message
  private static generateAlertMessage(budget: BudgetLimit, progress: BudgetProgress): string {
    const categoryText = budget.category ? ` for ${budget.category}` : '';
    const periodText = budget.period;
    
    if (progress.percentage >= 100) {
      return `You've exceeded your ${periodText} budget "${budget.name}"${categoryText}! Spent $${progress.spent.toFixed(2)} of $${budget.amount.toFixed(2)} (${progress.percentage}%)`;
    } else if (progress.percentage >= progress.warningThreshold) {
      return `You're approaching your ${periodText} budget "${budget.name}"${categoryText}. Spent $${progress.spent.toFixed(2)} of $${budget.amount.toFixed(2)} (${progress.percentage}%)`;
    } else {
      return `Budget "${budget.name}"${categoryText} is at ${progress.percentage}% for this ${periodText}`;
    }
  }

  // Get active alerts
  static async getAlerts(userId: string): Promise<BudgetAlert[]> {
    try {
      return await BudgetDB.getAlerts(userId);
    } catch (error) {
      console.error('Error getting alerts:', error);
      throw error;
    }
  }

  // Dismiss an alert
  static async dismissAlert(alertId: string): Promise<void> {
    try {
      await BudgetDB.dismissAlert(alertId);
    } catch (error) {
      console.error('Error dismissing alert:', error);
      throw error;
    }
  }

  // Clean up old alerts
  static async cleanupOldAlerts(userId: string): Promise<void> {
    try {
      await BudgetDB.clearOldAlerts(userId, 7); // Clear alerts older than 7 days
    } catch (error) {
      console.error('Error cleaning up old alerts:', error);
      throw error;
    }
  }

  // Format currency
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}
