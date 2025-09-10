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
import { ExpenseDB } from './database';
import { Expense } from '../types/expense';

export class SyncService {
  private static syncInProgress = false;
  private static listeners: Unsubscribe[] = [];

  // Sync local expenses to Firebase
  static async syncToFirebase(userId: string): Promise<void> {
    if (this.syncInProgress) return;
    
    try {
      this.syncInProgress = true;
      console.log('Starting sync to Firebase...');

      const unsyncedExpenses = await ExpenseDB.getUnsyncedExpenses(userId);
      
      for (const expense of unsyncedExpenses) {
        try {
          await setDoc(doc(db, 'expenses', expense.id), {
            ...expense,
            synced: true
          });
          
          // Mark as synced in local database
          await ExpenseDB.markAsSynced(expense.id);
          console.log(`Synced expense ${expense.id} to Firebase`);
        } catch (error) {
          console.error(`Failed to sync expense ${expense.id}:`, error);
        }
      }

      console.log(`Synced ${unsyncedExpenses.length} expenses to Firebase`);
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

  // Full bidirectional sync
  static async fullSync(userId: string): Promise<void> {
    try {
      // First sync from Firebase to get any new expenses
      await this.syncFromFirebase(userId);
      
      // Then sync local changes to Firebase
      await this.syncToFirebase(userId);
      
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
      console.log('Device came back online, starting sync...');
      try {
        await this.fullSync(userId);
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    };

    window.addEventListener('online', handleOnline);

    // Also setup realtime sync if online
    if (this.isOnline()) {
      this.setupRealtimeSync(userId, onUpdate);
    }
  }

  // Cleanup listeners
  static cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
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
