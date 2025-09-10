import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  deleteDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { ExpenseDB, BudgetDB } from './database';
import { Expense } from '../types/expense';
import type { BudgetLimit } from '../types/budget';

export class SyncService {
  private static syncInProgress = false;
  private static listeners: Unsubscribe[] = [];

  // Sync local expenses to Firebase
  static async syncToFirebase(userId: string): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    try {
      this.syncInProgress = true;
      console.log('Starting sync to Firebase for user:', userId);

      const unsyncedExpenses = await ExpenseDB.getUnsyncedExpenses(userId);
      console.log(`Found ${unsyncedExpenses.length} unsynced expenses to upload`);

      if (unsyncedExpenses.length === 0) {
        console.log('No unsynced expenses found');
        return;
      }

      let successCount = 0;
      let failureCount = 0;

      for (const expense of unsyncedExpenses) {
        try {
          console.log(`Syncing expense ${expense.id} to Firebase...`);
          await setDoc(doc(db, 'expenses', expense.id), {
            ...expense,
            synced: true
          });

          // Mark as synced in local database
          await ExpenseDB.markAsSynced(expense.id);
          console.log(`✓ Successfully synced expense ${expense.id} to Firebase`);
          successCount++;
        } catch (error) {
          console.error(`✗ Failed to sync expense ${expense.id}:`, error);
          failureCount++;
        }
      }

      console.log(`Sync to Firebase completed: ${successCount} successful, ${failureCount} failed`);
    } catch (error) {
      console.error('Error syncing to Firebase:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync Firebase expenses to local database
  static async syncFromFirebase(userId: string): Promise<void> {
    try {
      console.log('Starting sync from Firebase...');

      const expensesRef = collection(db, 'expenses');
      const q = query(
        expensesRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const firebaseExpenses: Expense[] = [];

      querySnapshot.forEach((doc) => {
        firebaseExpenses.push(doc.data() as Expense);
      });

      // Get local expenses
      const localExpenses = await ExpenseDB.getExpenses(userId);
      const localExpenseIds = new Set(localExpenses.map(e => e.id));

      // Add new expenses from Firebase to local database
      let addedCount = 0;
      for (const firebaseExpense of firebaseExpenses) {
        if (!localExpenseIds.has(firebaseExpense.id)) {
          await ExpenseDB.addExpense({
            ...firebaseExpense,
            synced: true
          });
          addedCount++;
        }
      }

      console.log(`Synced ${addedCount} new expenses from Firebase`);
    } catch (error) {
      console.error('Error syncing from Firebase:', error);
      throw error;
    }
  }

  // Sync local budgets to Firebase
  static async syncBudgetsToFirebase(userId: string): Promise<void> {
    try {
      console.log('Starting budget sync to Firebase for user:', userId);

      const unsyncedBudgets = await BudgetDB.getUnsyncedBudgets(userId);
      console.log(`Found ${unsyncedBudgets.length} unsynced budgets to upload`);

      if (unsyncedBudgets.length === 0) {
        console.log('No unsynced budgets found');
        return;
      }

      let successCount = 0;
      let failureCount = 0;

      for (const budget of unsyncedBudgets) {
        try {
          console.log(`Syncing budget ${budget.id} to Firebase...`);
          await setDoc(doc(db, 'budgets', budget.id), {
            ...budget,
            synced: true
          });

          // Mark as synced in local database
          await BudgetDB.markBudgetAsSynced(budget.id);
          console.log(`✓ Successfully synced budget ${budget.id} to Firebase`);
          successCount++;
        } catch (error) {
          console.error(`✗ Failed to sync budget ${budget.id}:`, error);
          failureCount++;
        }
      }

      console.log(`Budget sync to Firebase completed: ${successCount} successful, ${failureCount} failed`);
    } catch (error) {
      console.error('Error syncing budgets to Firebase:', error);
      throw error;
    }
  }

  // Sync Firebase budgets to local database
  static async syncBudgetsFromFirebase(userId: string): Promise<void> {
    try {
      console.log('Starting budget sync from Firebase...');

      const budgetsRef = collection(db, 'budgets');
      const q = query(
        budgetsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const firebaseBudgets: BudgetLimit[] = [];

      querySnapshot.forEach((doc) => {
        firebaseBudgets.push(doc.data() as BudgetLimit);
      });

      // Get local budgets
      const localBudgets = await BudgetDB.getBudgets(userId);
      const localBudgetIds = new Set(localBudgets.map(b => b.id));

      // Add new budgets from Firebase to local database
      let addedCount = 0;
      for (const firebaseBudget of firebaseBudgets) {
        if (!localBudgetIds.has(firebaseBudget.id)) {
          await BudgetDB.addBudget({
            ...firebaseBudget,
            synced: true
          });
          addedCount++;
        }
      }

      console.log(`Synced ${addedCount} new budgets from Firebase`);
    } catch (error) {
      console.error('Error syncing budgets from Firebase:', error);
      throw error;
    }
  }

  // Full bidirectional sync
  static async fullSync(userId: string): Promise<void> {
    try {
      // First sync from Firebase to get any new data
      await this.syncFromFirebase(userId);
      await this.syncBudgetsFromFirebase(userId);

      // Then sync local changes to Firebase
      await this.syncToFirebase(userId);
      await this.syncBudgetsToFirebase(userId);

      console.log('Full sync completed');
    } catch (error) {
      console.error('Error during full sync:', error);
      throw error;
    }
  }

  // Set up real-time listener for Firebase changes
  static setupRealtimeSync(userId: string, onUpdate?: () => void): Unsubscribe {
    const expensesRef = collection(db, 'expenses');
    const q = query(
      expensesRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const changes = snapshot.docChanges();
        let hasChanges = false;

        for (const change of changes) {
          const expense = change.doc.data() as Expense;
          
          if (change.type === 'added' || change.type === 'modified') {
            // Check if this expense exists locally
            const localExpenses = await ExpenseDB.getExpenses(userId);
            const existsLocally = localExpenses.some(e => e.id === expense.id);
            
            if (!existsLocally) {
              await ExpenseDB.addExpense({
                ...expense,
                synced: true
              });
              hasChanges = true;
            }
          } else if (change.type === 'removed') {
            await ExpenseDB.deleteExpense(expense.id);
            hasChanges = true;
          }
        }

        if (hasChanges && onUpdate) {
          onUpdate();
        }
      } catch (error) {
        console.error('Error handling realtime sync:', error);
      }
    });

    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  // Check if online
  static isOnline(): boolean {
    return navigator.onLine;
  }

  // Auto-sync when coming back online
  static setupAutoSync(userId: string, onUpdate?: () => void): void {
    const handleOnline = async () => {
      console.log('SyncService: Device came back online, starting auto-sync...');
      try {
        // Wait a bit to ensure connection is stable
        setTimeout(async () => {
          await this.fullSync(userId);
          console.log('SyncService: Auto-sync completed');
          if (onUpdate) onUpdate();
        }, 1000);
      } catch (error) {
        console.error('SyncService: Auto-sync failed:', error);
      }
    };

    // Remove existing listener to avoid duplicates
    window.removeEventListener('online', handleOnline);
    window.addEventListener('online', handleOnline);
    console.log('SyncService: Auto-sync listener set up for user:', userId);

    // Also setup realtime sync if online
    if (this.isOnline()) {
      console.log('SyncService: Setting up realtime sync (device is online)');
      this.setupRealtimeSync(userId, onUpdate);
    }
  }

  // Cleanup listeners
  static cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
  }

  // Debug method to check unsynced expenses
  static async debugUnsyncedExpenses(userId: string): Promise<void> {
    try {
      const unsyncedExpenses = await ExpenseDB.getUnsyncedExpenses(userId);
      console.log(`DEBUG: Found ${unsyncedExpenses.length} unsynced expenses for user ${userId}:`);
      unsyncedExpenses.forEach(expense => {
        console.log(`- ${expense.id}: ${expense.description} (${expense.amount}) - synced: ${expense.synced}`);
      });
    } catch (error) {
      console.error('Error debugging unsynced expenses:', error);
    }
  }

  // Delete expense from both local and Firebase
  static async deleteExpense(expenseId: string): Promise<void> {
    try {
      // Delete from local database
      await ExpenseDB.deleteExpense(expenseId);
      
      // Delete from Firebase if online
      if (this.isOnline()) {
        await deleteDoc(doc(db, 'expenses', expenseId));
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }
}
