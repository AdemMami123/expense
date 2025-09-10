export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  synced: boolean; // Whether this expense has been synced to Firebase
}

export interface ExpenseFormData {
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface ExpenseStats {
  totalExpenses: number;
  dailyTotal: number;
  weeklyTotal: number;
  monthlyTotal: number;
  categoryTotals: Record<string, number>;
}

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Personal Care',
  'Other'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
