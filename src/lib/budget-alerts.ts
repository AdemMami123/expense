import { Expense } from '../types/expense';

export interface BudgetLimit {
  id: string;
  category?: string; // If undefined, applies to total spending
  amount: number;
  period: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  createdAt: string;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  type: 'warning' | 'exceeded';
  message: string;
  currentAmount: number;
  budgetAmount: number;
  percentage: number;
  createdAt: string;
  dismissed: boolean;
}

export class BudgetAlertService {
  private static readonly STORAGE_KEY_BUDGETS = 'expense-tracker-budgets';
  private static readonly STORAGE_KEY_ALERTS = 'expense-tracker-alerts';
  private static readonly WARNING_THRESHOLD = 80; // 80% of budget

  // Budget Management
  static saveBudgetLimit(budget: BudgetLimit): void {
    const budgets = this.getBudgetLimits();
    const existingIndex = budgets.findIndex(b => b.id === budget.id);
    
    if (existingIndex >= 0) {
      budgets[existingIndex] = budget;
    } else {
      budgets.push(budget);
    }
    
    localStorage.setItem(this.STORAGE_KEY_BUDGETS, JSON.stringify(budgets));
  }

  static getBudgetLimits(): BudgetLimit[] {
    const stored = localStorage.getItem(this.STORAGE_KEY_BUDGETS);
    return stored ? JSON.parse(stored) : [];
  }

  static deleteBudgetLimit(budgetId: string): void {
    const budgets = this.getBudgetLimits().filter(b => b.id !== budgetId);
    localStorage.setItem(this.STORAGE_KEY_BUDGETS, JSON.stringify(budgets));
    
    // Also remove related alerts
    const alerts = this.getBudgetAlerts().filter(a => a.budgetId !== budgetId);
    localStorage.setItem(this.STORAGE_KEY_ALERTS, JSON.stringify(alerts));
  }

  // Alert Management
  static getBudgetAlerts(): BudgetAlert[] {
    const stored = localStorage.getItem(this.STORAGE_KEY_ALERTS);
    return stored ? JSON.parse(stored) : [];
  }

  static dismissAlert(alertId: string): void {
    const alerts = this.getBudgetAlerts();
    const alertIndex = alerts.findIndex(a => a.id === alertId);
    
    if (alertIndex >= 0) {
      alerts[alertIndex].dismissed = true;
      localStorage.setItem(this.STORAGE_KEY_ALERTS, JSON.stringify(alerts));
    }
  }

  static clearOldAlerts(): void {
    const alerts = this.getBudgetAlerts();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentAlerts = alerts.filter(alert => 
      new Date(alert.createdAt) > oneWeekAgo
    );
    
    localStorage.setItem(this.STORAGE_KEY_ALERTS, JSON.stringify(recentAlerts));
  }

  // Budget Checking
  static checkBudgets(expenses: Expense[]): BudgetAlert[] {
    const budgets = this.getBudgetLimits().filter(b => b.enabled);
    const newAlerts: BudgetAlert[] = [];
    
    budgets.forEach(budget => {
      const currentSpending = this.calculateCurrentSpending(expenses, budget);
      const percentage = (currentSpending / budget.amount) * 100;
      
      // Check if we need to create an alert
      if (percentage >= this.WARNING_THRESHOLD) {
        const alertType: 'warning' | 'exceeded' = percentage >= 100 ? 'exceeded' : 'warning';
        
        // Check if we already have a recent alert for this budget
        const existingAlert = this.getBudgetAlerts().find(alert => 
          alert.budgetId === budget.id && 
          alert.type === alertType &&
          !alert.dismissed &&
          this.isRecentAlert(alert.createdAt, budget.period)
        );
        
        if (!existingAlert) {
          const alert: BudgetAlert = {
            id: this.generateId(),
            budgetId: budget.id,
            type: alertType,
            message: this.generateAlertMessage(budget, currentSpending, percentage),
            currentAmount: currentSpending,
            budgetAmount: budget.amount,
            percentage: Math.round(percentage),
            createdAt: new Date().toISOString(),
            dismissed: false
          };
          
          newAlerts.push(alert);
        }
      }
    });
    
    // Save new alerts
    if (newAlerts.length > 0) {
      const allAlerts = [...this.getBudgetAlerts(), ...newAlerts];
      localStorage.setItem(this.STORAGE_KEY_ALERTS, JSON.stringify(allAlerts));
    }
    
    return newAlerts;
  }

  private static calculateCurrentSpending(expenses: Expense[], budget: BudgetLimit): number {
    const now = new Date();
    let startDate: Date;
    
    switch (budget.period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay() + 1); // Monday
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }
    
    const relevantExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const matchesDate = expenseDate >= startDate;
      const matchesCategory = !budget.category || expense.category === budget.category;
      return matchesDate && matchesCategory;
    });
    
    return relevantExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  private static generateAlertMessage(
    budget: BudgetLimit, 
    currentAmount: number, 
    percentage: number
  ): string {
    const categoryText = budget.category ? ` for ${budget.category}` : '';
    const periodText = budget.period;
    
    if (percentage >= 100) {
      return `You've exceeded your ${periodText} budget${categoryText}! Spent $${currentAmount.toFixed(2)} of $${budget.amount.toFixed(2)} (${Math.round(percentage)}%)`;
    } else {
      return `You're approaching your ${periodText} budget${categoryText}. Spent $${currentAmount.toFixed(2)} of $${budget.amount.toFixed(2)} (${Math.round(percentage)}%)`;
    }
  }

  private static isRecentAlert(alertDate: string, period: BudgetLimit['period']): boolean {
    const alertTime = new Date(alertDate);
    const now = new Date();
    
    switch (period) {
      case 'daily':
        return alertTime.toDateString() === now.toDateString();
      case 'weekly':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return alertTime > weekAgo;
      case 'monthly':
        return alertTime.getMonth() === now.getMonth() && 
               alertTime.getFullYear() === now.getFullYear();
    }
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Utility methods
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  static getBudgetProgress(expenses: Expense[], budget: BudgetLimit): {
    spent: number;
    remaining: number;
    percentage: number;
    daysLeft: number;
  } {
    const spent = this.calculateCurrentSpending(expenses, budget);
    const remaining = Math.max(0, budget.amount - spent);
    const percentage = (spent / budget.amount) * 100;
    
    // Calculate days left in period
    const now = new Date();
    let daysLeft: number;
    
    switch (budget.period) {
      case 'daily':
        daysLeft = 1;
        break;
      case 'weekly':
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
        daysLeft = Math.ceil((endOfWeek.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        break;
      case 'monthly':
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        daysLeft = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        break;
    }
    
    return { spent, remaining, percentage, daysLeft };
  }
}
