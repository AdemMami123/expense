import { Expense } from '../types/expense';

export class CSVExport {
  static exportExpenses(expenses: Expense[], filename?: string): void {
    if (expenses.length === 0) {
      alert('No expenses to export');
      return;
    }

    // Define CSV headers
    const headers = [
      'Date',
      'Amount',
      'Category',
      'Description',
      'Created At',
      'Synced'
    ];

    // Convert expenses to CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...expenses.map(expense => [
        expense.date,
        expense.amount.toFixed(2),
        `"${expense.category}"`, // Wrap in quotes to handle commas
        `"${expense.description.replace(/"/g, '""')}"`, // Escape quotes
        expense.createdAt,
        expense.synced ? 'Yes' : 'No'
      ].join(','))
    ];

    // Create CSV content
    const csvContent = csvRows.join('\n');

    // Create and download file
    this.downloadCSV(csvContent, filename);
  }

  static exportExpensesByDateRange(
    expenses: Expense[], 
    startDate: string, 
    endDate: string,
    filename?: string
  ): void {
    const filteredExpenses = expenses.filter(
      expense => expense.date >= startDate && expense.date <= endDate
    );

    const defaultFilename = `expenses_${startDate}_to_${endDate}.csv`;
    this.exportExpenses(filteredExpenses, filename || defaultFilename);
  }

  static exportExpensesByCategory(
    expenses: Expense[], 
    category: string,
    filename?: string
  ): void {
    const filteredExpenses = expenses.filter(
      expense => expense.category === category
    );

    const defaultFilename = `expenses_${category.toLowerCase().replace(/\s+/g, '_')}.csv`;
    this.exportExpenses(filteredExpenses, filename || defaultFilename);
  }

  static exportExpenseSummary(expenses: Expense[], filename?: string): void {
    if (expenses.length === 0) {
      alert('No expenses to export');
      return;
    }

    // Calculate summary data
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const categoryTotals: Record<string, { amount: number; count: number }> = {};
    
    expenses.forEach(expense => {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = { amount: 0, count: 0 };
      }
      categoryTotals[expense.category].amount += expense.amount;
      categoryTotals[expense.category].count += 1;
    });

    // Create summary CSV
    const summaryRows = [
      'Summary,Value',
      `Total Expenses,${expenses.length}`,
      `Total Amount,$${totalAmount.toFixed(2)}`,
      `Average Amount,$${(totalAmount / expenses.length).toFixed(2)}`,
      '',
      'Category,Amount,Count,Average',
      ...Object.entries(categoryTotals).map(([category, data]) => [
        `"${category}"`,
        `$${data.amount.toFixed(2)}`,
        data.count,
        `$${(data.amount / data.count).toFixed(2)}`
      ].join(','))
    ];

    const csvContent = summaryRows.join('\n');
    const defaultFilename = `expense_summary_${new Date().toISOString().split('T')[0]}.csv`;
    
    this.downloadCSV(csvContent, filename || defaultFilename);
  }

  private static downloadCSV(csvContent: string, filename?: string): void {
    const defaultFilename = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    const finalFilename = filename || defaultFilename;

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      // Feature detection for download attribute
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', finalFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Fallback for older browsers
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
    }
  }

  static generateExpenseReport(expenses: Expense[]): string {
    if (expenses.length === 0) {
      return 'No expenses found for the selected period.';
    }

    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const categoryTotals: Record<string, number> = {};
    
    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a);

    let report = `Expense Report\n`;
    report += `Generated: ${new Date().toLocaleString()}\n\n`;
    report += `Total Expenses: ${expenses.length}\n`;
    report += `Total Amount: $${totalAmount.toFixed(2)}\n`;
    report += `Average Amount: $${(totalAmount / expenses.length).toFixed(2)}\n\n`;
    report += `Spending by Category:\n`;
    
    sortedCategories.forEach(([category, amount]) => {
      const percentage = ((amount / totalAmount) * 100).toFixed(1);
      report += `${category}: $${amount.toFixed(2)} (${percentage}%)\n`;
    });

    return report;
  }
}
