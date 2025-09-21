import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';

export interface Transaction {
  type: string;
  account?: string; // Optional for transfer transactions
  account_from?: string; // For transfer transactions
  account_to?: string; // For transfer transactions
  amount: number;
  date: string;
  time: string;
  description: string; // For regular transactions
  description_from?: string; // For transfer transactions (from account perspective)
  description_to?: string; // For transfer transactions (to account perspective)
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly CURRENT_DATE_KEY = 'investing_sim__current_date';
  private readonly TRANSACTIONS_KEY = 'investing_sim__transactions';
  
  private accounts: {
    banking001: {name: "Banking Account", initialBalance: number, type: "banking"},
    brokerage001: {name: "Brokerage Account", initialBalance: number, type: "brokerage"}
  } = {
    banking001: {name: "Banking Account", initialBalance: 0, type: "banking"},
    brokerage001: {name: "Brokerage Account", initialBalance: 0, type: "brokerage"}
  };
  
  // Current date BehaviorSubject
  private currentDateSubject = new BehaviorSubject<string>(this.getStoredCurrentDate());
  public currentDate$ = this.currentDateSubject.asObservable();

  // Transactions BehaviorSubject
  private transactionsSubject = new BehaviorSubject<Transaction[]>(this.getStoredTransactions());
  public transactions$ = this.transactionsSubject.asObservable();

  // Combined observables for reactive account data
  public accountData$ = combineLatest([
    this.currentDate$,
    this.transactions$
  ]).pipe(
    map(([currentDate, transactions]) => {
      const sortedTransactions = transactions.sort((a, b) => {
        const dateTimeA = `${a.date} ${a.time}`;
        const dateTimeB = `${b.date} ${b.time}`;
        return dateTimeB.localeCompare(dateTimeA); // Descending order (newest first)
      });

      const filteredTransactions = sortedTransactions.filter(t => t.date <= currentDate);
      
      const balances: { [accountId: string]: number } = {};
      
      // Initialize balances with initial amounts
      Object.keys(this.accounts).forEach(accountId => {
        balances[accountId] = this.accounts[accountId as keyof typeof this.accounts].initialBalance;
      });
      
      // Apply transactions
      filteredTransactions.forEach(transaction => {
        if (transaction.type === 'transfer') {
          // Handle transfer transactions
          if (transaction.account_from && balances.hasOwnProperty(transaction.account_from)) {
            balances[transaction.account_from] -= transaction.amount;
          }
          if (transaction.account_to && balances.hasOwnProperty(transaction.account_to)) {
            balances[transaction.account_to] += transaction.amount;
          }
        } else {
          // Handle regular transactions
          if (transaction.account && balances.hasOwnProperty(transaction.account)) {
            balances[transaction.account] += transaction.amount;
          }
        }
      });
      
      return {
        currentDate,
        transactions: filteredTransactions,
        balances
      };
    })
  );


  constructor() {
    // Initialize with stored date on service creation
    this.initializeCurrentDate();
    // Initialize with stored transactions
    this.initializeTransactions();
    // Ensure both are saved to localStorage
    this.ensureLocalStorageInitialized();
  }

  /**
   * Set the current date and save to local storage
   */
  setCurrentDate(date: string): void {
    this.currentDateSubject.next(date);
    this.saveCurrentDateToStorage(date);
  }

  

  /**
   * Initialize current date from local storage or default
   */
  private initializeCurrentDate(): void {
    const storedDate = this.getStoredCurrentDate();
    this.currentDateSubject.next(storedDate);
  }

  /**
   * Get stored current date from local storage
   */
  private getStoredCurrentDate(): string {
    try {
      const stored = localStorage.getItem(this.CURRENT_DATE_KEY);
      if (stored && this.isValidDateString(stored)) {
        return stored;
      }
    } catch (error) {
      console.warn('Error reading current date from localStorage:', error);
    }
    
    // Default to Quarter 1 (January 1, 2025)
    return '2025-01-01';
  }

  /**
   * Save current date to local storage
   */
  private saveCurrentDateToStorage(date: string): void {
    try {
      localStorage.setItem(this.CURRENT_DATE_KEY, date);
    } catch (error) {
      console.error('Error saving current date to localStorage:', error);
    }
  }

  /**
   * Validate date string format (YYYY-MM-DD)
   */
  private isValidDateString(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      return false;
    }
    
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date.toISOString().split('T')[0] === dateString;
  }

  /**
   * Get quarter options for the dropdown
   */
  getQuarterOptions(): Array<{label: string, value: string}> {
    return [
      { label: 'Quarter 1', value: '2025-01-01' },
      { label: 'Quarter 2', value: '2025-04-01' },
      { label: 'Quarter 3', value: '2025-07-01' },
      { label: 'Quarter 4', value: '2025-10-01' }
    ];
  }

  /**
   * Get quarter label for a given date string
   */
  getQuarterLabel(date: string): string {
    const options = this.getQuarterOptions();
    const matchingOption = options.find(option => option.value === date);
    return matchingOption ? matchingOption.label : 'Unknown Quarter';
  }

  /**
   * Initialize transactions from local storage
   */
  private initializeTransactions(): void {
    const storedTransactions = this.getStoredTransactions();
    this.transactionsSubject.next(storedTransactions);
  }

  /**
   * Ensure localStorage is properly initialized with default values
   */
  private ensureLocalStorageInitialized(): void {
    // Ensure current date is saved
    const currentDate = this.currentDateSubject.value;
    this.saveCurrentDateToStorage(currentDate);
    
    // Ensure transactions are saved
    const currentTransactions = this.transactionsSubject.value;
    this.saveTransactionsToStorage(currentTransactions);
  }

  /**
   * Get stored transactions from local storage
   */
  private getStoredTransactions(): Transaction[] {
    try {
      const stored = localStorage.getItem(this.TRANSACTIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Error reading transactions from localStorage:', error);
    }
    
    // Default initial transaction
    return [
      {
        type: "transaction",
        account: "banking001",
        amount: 5000,
        date: "2024-12-01",
        time: "00:00:00",
        description: "Initial deposit"
      }
    ];
  }

  /**
   * Save transactions to local storage
   */
  private saveTransactionsToStorage(transactions: Transaction[]): void {
    try {
      localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions to localStorage:', error);
    }
  }

  /**
   * Add a new transaction
   */
  addTransaction(transaction: Transaction): void {
    const currentTransactions = this.transactionsSubject.value;
    const updatedTransactions = [...currentTransactions, transaction];
    this.transactionsSubject.next(updatedTransactions);
    this.saveTransactionsToStorage(updatedTransactions);
  }

  /**
   * Add a transfer transaction from banking to brokerage
   */
  addTransferTransaction(amount: number, date: string): void {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0]; // Get HH:MM:SS format
    
    const transferTransaction: Transaction = {
      type: "transfer",
      account_from: "banking001",
      account_to: "brokerage001",
      amount: amount,
      date: date,
      time: timeString,
      description: "Transfer to brokerage",
      description_from: "Transfer to brokerage",
      description_to: "Transfer from banking"
    };

    this.addTransaction(transferTransaction);
  }

  /**
   * Add a transfer transaction from brokerage to banking
   */
  addTransferToBankingTransaction(amount: number, date: string): void {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0]; // Get HH:MM:SS format
    
    const transferTransaction: Transaction = {
      type: "transfer",
      account_from: "brokerage001",
      account_to: "banking001",
      amount: amount,
      date: date,
      time: timeString,
      description: "Transfer to banking",
      description_from: "Transfer to banking",
      description_to: "Transfer from brokerage"
    };

    this.addTransaction(transferTransaction);
  }

  /**
   * Get all transactions ordered by date, time ascending (reactive)
   */
  getAllTransactions$(): Observable<Transaction[]> {
    return this.transactions$.pipe(
      map(transactions => transactions.sort((a, b) => {
        const dateTimeA = `${a.date} ${a.time}`;
        const dateTimeB = `${b.date} ${b.time}`;
        return dateTimeA.localeCompare(dateTimeB);
      }))
    );
  }

  /**
   * Get transactions and balance as of current date (reactive)
   */
  getCurrentAccountData$(): Observable<{ transactions: Transaction[], balances: { [accountId: string]: number } }> {
    return this.accountData$.pipe(
      map(data => ({
        transactions: data.transactions,
        balances: data.balances
      }))
    );
  }

  /**
   * Get current balance for a specific account (reactive)
   */
  getCurrentBalance$(accountId: string): Observable<number> {
    return this.accountData$.pipe(
      map(data => data.balances[accountId] || 0)
    );
  }

  /**
   * Get transactions for a specific account (reactive)
   */
  getTransactionsForAccount$(accountId: string): Observable<Transaction[]> {
    return this.accountData$.pipe(
      map(data => data.transactions.filter(t => 
        t.account === accountId || 
        (t.type === 'transfer' && (t.account_from === accountId || t.account_to === accountId))
      ))
    );
  }

  /**
   * Get transactions with running balances for a specific account (reactive)
   */
  getTransactionsWithRunningBalance$(accountId: string): Observable<Array<Transaction & { runningBalance: number, displayDescription: string }>> {
    return this.accountData$.pipe(
      map(data => {
        // Get all transactions for this account, sorted in descending order
        const accountTransactions = data.transactions.filter(t => 
          t.account === accountId || 
          (t.type === 'transfer' && (t.account_from === accountId || t.account_to === accountId))
        );

        // Calculate running balances (working backwards from current balance)
        const currentBalance = data.balances[accountId] || 0;
        let runningBalance = currentBalance;
        
        return accountTransactions.map(transaction => {
          let transactionAmount = 0;
          let displayDescription = transaction.description;
          
          if (transaction.type === 'transfer') {
            if (transaction.account_from === accountId) {
              transactionAmount = -transaction.amount;
              displayDescription = transaction.description_from || transaction.description;
            } else if (transaction.account_to === accountId) {
              transactionAmount = transaction.amount;
              displayDescription = transaction.description_to || transaction.description;
            }
          } else {
            transactionAmount = transaction.amount;
          }
          
          // Calculate running balance after this transaction
          const balanceAfterTransaction = runningBalance;
          runningBalance -= transactionAmount;
          
          return {
            ...transaction,
            runningBalance: balanceAfterTransaction,
            displayDescription: displayDescription
          };
        });
      })
    );
  }

  /**
   * Get transactions and balance as of a specific date (reactive)
   */
  getTransactionsAndBalanceAsOf$(asOfDate: string): Observable<{ transactions: Transaction[], balances: { [accountId: string]: number } }> {
    return this.transactions$.pipe(
      map(transactions => {
        const sortedTransactions = transactions.sort((a, b) => {
          const dateTimeA = `${a.date} ${a.time}`;
          const dateTimeB = `${b.date} ${b.time}`;
          return dateTimeA.localeCompare(dateTimeB);
        });

        const filteredTransactions = sortedTransactions.filter(t => t.date <= asOfDate);
        
        const balances: { [accountId: string]: number } = {};
        
        // Initialize balances with initial amounts
        Object.keys(this.accounts).forEach(accountId => {
          balances[accountId] = this.accounts[accountId as keyof typeof this.accounts].initialBalance;
        });
        
        // Apply transactions
        filteredTransactions.forEach(transaction => {
          if (transaction.type === 'transfer') {
            // Handle transfer transactions
            if (transaction.account_from && balances.hasOwnProperty(transaction.account_from)) {
              balances[transaction.account_from] -= transaction.amount;
            }
            if (transaction.account_to && balances.hasOwnProperty(transaction.account_to)) {
              balances[transaction.account_to] += transaction.amount;
            }
          } else {
            // Handle regular transactions
            if (transaction.account && balances.hasOwnProperty(transaction.account)) {
              balances[transaction.account] += transaction.amount;
            }
          }
        });
        
        return {
          transactions: filteredTransactions,
          balances
        };
      })
    );
  }
}
