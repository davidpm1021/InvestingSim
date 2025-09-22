import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { CurrentDateService } from './current-date.service';

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
export class TransactionsService {
  private readonly TRANSACTIONS_KEY = 'investing_sim__transactions';
  
  private accounts: {
    banking001: {name: "Banking Account", initialBalance: number, type: "banking"},
    brokerage001: {name: "Brokerage Account", initialBalance: number, type: "brokerage"}
  } = {
    banking001: {name: "Banking Account", initialBalance: 0, type: "banking"},
    brokerage001: {name: "Brokerage Account", initialBalance: 0, type: "brokerage"}
  };

  // Transactions BehaviorSubject
  private transactionsSubject = new BehaviorSubject<Transaction[]>(this.getStoredTransactions());
  public transactions$ = this.transactionsSubject.asObservable();

  // Combined observables for reactive account data
  public accountData$: Observable<any>;

  constructor(private currentDateService: CurrentDateService) {
    // Initialize with stored transactions
    this.initializeTransactions();
    // Ensure transactions are saved to localStorage
    this.ensureLocalStorageInitialized();
    
    // Initialize observables that depend on CurrentDateService
    this.accountData$ = combineLatest([
      this.currentDateService.currentDate$,
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
    
    // Create two separate transactions - one for each account
    const bankingTransaction: Transaction = {
      type: "transfer",
      account: "banking001",
      amount: -amount, // Negative for banking (money going out)
      date: date,
      time: timeString,
      description: "Transfer to brokerage"
    };

    const brokerageTransaction: Transaction = {
      type: "transfer",
      account: "brokerage001",
      amount: amount, // Positive for brokerage (money coming in)
      date: date,
      time: timeString,
      description: "Transfer from banking"
    };

    this.addTransaction(bankingTransaction);
    this.addTransaction(brokerageTransaction);
  }

  /**
   * Add a transfer transaction from brokerage to banking
   */
  addTransferToBankingTransaction(amount: number, date: string): void {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0]; // Get HH:MM:SS format
    
    // Create two separate transactions - one for each account
    const brokerageTransaction: Transaction = {
      type: "transfer",
      account: "brokerage001",
      amount: -amount, // Negative for brokerage (money going out)
      date: date,
      time: timeString,
      description: "Transfer to banking"
    };

    const bankingTransaction: Transaction = {
      type: "transfer",
      account: "banking001",
      amount: amount, // Positive for banking (money coming in)
      date: date,
      time: timeString,
      description: "Transfer from brokerage"
    };

    this.addTransaction(brokerageTransaction);
    this.addTransaction(bankingTransaction);
  }

  /**
   * Add a trade transaction (buy or sell)
   */
  addTradeTransaction(accountId: string, assetId: string, action: 'buy' | 'sell', shares: number, price: number, date: string, assetName?: string, assetType?: string): void {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0]; // Get HH:MM:SS format
    
    // Calculate the dollar amount
    const dollarAmount = shares * price;
    
    // Determine the transaction amount based on action
    const transactionAmount = action === 'buy' ? -dollarAmount : dollarAmount;
    
    // Create description with new format
    const actionText = action === 'buy' ? 'Purchased' : 'Sold';
    let description: string;
    
    if (assetName && assetType) {
      // Format: "Purchased 0.36 shares of Apple Inc. (Stock) at $120.00"
      const formattedAssetType = assetType.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
      description = `${actionText} ${shares.toFixed(2)} shares of ${assetName} (${formattedAssetType}) at $${price.toFixed(2)}`;
    } else {
      // Fallback to old format if asset info not provided
      const actionTextOld = action === 'buy' ? 'Buy' : 'Sell';
      description = `${actionTextOld} ${shares} shares at $${price.toFixed(2)}`;
    }
    
    const tradeTransaction: Transaction = {
      type: "trade",
      account: accountId,
      amount: transactionAmount,
      date: date,
      time: timeString,
      description: description
    };

    this.addTransaction(tradeTransaction);
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
      map((data: any) => data.transactions.filter((t: Transaction) => 
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
      map((data: any) => {
        // Get all transactions for this account, sorted in descending order
        const accountTransactions = data.transactions.filter((t: Transaction) => 
          t.account === accountId || 
          (t.type === 'transfer' && (t.account_from === accountId || t.account_to === accountId))
        );

        // Calculate running balances (working backwards from current balance)
        const currentBalance = data.balances[accountId] || 0;
        let runningBalance = currentBalance;
        
        return accountTransactions.map((transaction: Transaction) => {
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

  /**
   * Get balance for an account at a specific date
   */
  getBalanceAtDate(accountId: string, date: string): number {
    const allTransactions = this.transactionsSubject.value;
    let balance = 0;

    // Process all transactions up to the specified date
    const relevantTransactions = allTransactions
      .filter(tx => tx.date <= date && tx.account === accountId);
    
    relevantTransactions.forEach(tx => {
      balance += tx.amount;
    });

    // Debug logging (can be removed in production)
    // console.log(`Balance for ${accountId} at ${date}:`, balance);

    return balance;
  }

  /**
   * Get all transactions (for statements)
   */
  getAllTransactions(): Transaction[] {
    return this.transactionsSubject.value;
  }

}
