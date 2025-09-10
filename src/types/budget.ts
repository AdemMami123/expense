export interface BudgetLimit {
  id: string;
  userId: string;
  name: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category?: string; // If undefined, applies to all expenses
  enabled: boolean;
  warningThreshold: number; // Percentage (e.g., 80 for 80%)
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  userId: string;
  type: 'warning' | 'exceeded' | 'approaching';
  message: string;
  currentAmount: number;
  budgetAmount: number;
  percentage: number;
  period: string;
  category?: string;
  createdAt: string;
  dismissed: boolean;
}

export interface BudgetProgress {
  budgetId: string;
  budgetName: string;
  period: string;
  category?: string;
  spent: number;
  limit: number;
  remaining: number;
  percentage: number;
  daysLeft: number;
  status: 'safe' | 'warning' | 'exceeded';
  warningThreshold: number;
}

export interface BudgetFormData {
  name: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category?: string;
  warningThreshold: number;
  enabled: boolean;
}
