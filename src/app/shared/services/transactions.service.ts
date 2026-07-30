import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { CurrentDateService } from './current-date.service';
import { HoldingsService } from './holdings.service';
import { DataService } from './data.service';
import { SIM_YEAR_START, SIM_END, PAYING_QUARTER_ENDS } from '../data/quarters.data';

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

/** A persisted transaction row is usable only if it has a string type/date/time and a
 *  finite numeric amount (coerced from a possible string). Malformed rows are dropped so
 *  a tampered entry like a string amount can't concatenate into balances ("0"+"5000") or
 *  NaN the ledger, and a junk row like {} can't sit in the array contributing nothing. */
function isValidTransaction(row: any): boolean {
  return !!row && typeof row === 'object'
    && typeof row.type === 'string'
    && typeof row.date === 'string' && typeof row.time === 'string'
    && Number.isFinite(Number(row.amount));
}

function normalizeTransaction(row: any): Transaction {
  return { ...row, amount: Number(row.amount) };
}

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {
  private readonly TRANSACTIONS_KEY = 'investing_sim__transactions';

  // Set true when the transactions key exists but can't be read as a usable array
  // (parse error, non-array, or all rows malformed). Declared before transactionsSubject
  // so it is initialized when getStoredTransactions() first runs in the field below.
  private storageWasCorrupt = false;

  private accounts: {
    banking001: {name: string, initialBalance: number, type: "banking", apy: number},
    brokerage001: {name: string, initialBalance: number, type: "brokerage", apy: number}
  } = {
    banking001: {name: "Savings", initialBalance: 0, type: "banking", apy: 0.015},
    brokerage001: {name: "Cash Settlement Account", initialBalance: 0, type: "brokerage", apy: 0.0025}
  };

  // Transactions BehaviorSubject
  private transactionsSubject = new BehaviorSubject<Transaction[]>(this.getStoredTransactions());
  public transactions$ = this.transactionsSubject.asObservable();

  // Combined observables for reactive account data
  public accountData$: Observable<any>;

  constructor(
    private currentDateService: CurrentDateService,
    private holdingsService: HoldingsService,
    private dataService: DataService
  ) {
    // Initialize with stored transactions
    this.initializeTransactions();
    // Ensure transactions are saved to localStorage
    this.ensureLocalStorageInitialized();

    // Income derivation reads holding state, so the ledger cache must drop
    // whenever holding transactions change. (Registered before any consumer
    // subscribes to accountData$, so clears always run first.)
    this.holdingsService.holdingTransactions$.subscribe(() => this.ledgerCache.clear());
    
    // Initialize observables that depend on CurrentDateService
    this.accountData$ = combineLatest([
      this.currentDateService.currentDate$,
      this.transactions$,
      this.holdingsService.holdingTransactions$
    ]).pipe(
      map(([currentDate]) => {
        // Full derived ledger (base + interest + income), memoized per date.
        const filteredTransactions = [...this.getLedgerAsOf(currentDate)].sort((a, b) => {
          const dateTimeA = `${a.date} ${a.time}`;
          const dateTimeB = `${b.date} ${b.time}`;
          return dateTimeB.localeCompare(dateTimeA); // Descending order (newest first)
        });
        
        const balances: { [accountId: string]: number } = {};
        
        // Initialize balances with initial amounts
        Object.keys(this.accounts).forEach(accountId => {
          balances[accountId] = this.accounts[accountId as keyof typeof this.accounts].initialBalance;
        });
        
        // Apply each transaction to the balances it touches: a transfer debits
        // account_from and credits account_to; a regular entry credits its account.
        filteredTransactions.forEach(transaction => {
          Object.keys(balances).forEach(accountId => {
            balances[accountId] += this.signedAmount(transaction, accountId);
          });
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
    const currentTransactions = this.transactionsSubject.value;
    if (this.storageWasCorrupt) {
      // The transactions key existed but was unreadable, so its balance is unrecoverable.
      // Holdings persisted under a separate key would now reference a ledger that no longer
      // exists — a desync that would show shares with no matching cash. Reset BOTH stores
      // to a clean baseline rather than silently reseeding cash while stale holdings survive.
      console.error('investing_sim__transactions was corrupt; resetting to a clean state.');
      this.holdingsService.clearHoldingTransactions();
      this.seedInitialTransactions();
    } else if (currentTransactions.length === 0) {
      // Genuinely new (or post-reset) user: seed the starting deposit.
      this.seedInitialTransactions();
    } else {
      // Valid existing data: persist it (round-trips through the validated parse).
      this.saveTransactionsToStorage(currentTransactions);
    }
  }

  /** Seed the one-time $5000 opening deposit into Savings. */
  private seedInitialTransactions(): void {
    const defaultTransactions: Transaction[] = [
      {
        type: "transaction",
        account: "banking001",
        amount: 5000,
        date: "2024-12-01",
        time: "00:00:00",
        description: "Initial deposit"
      }
    ];
    this.saveTransactionsToStorage(defaultTransactions);
    this.transactionsSubject.next(defaultTransactions);
  }

  /**
   * Clear all transactions (for reset functionality)
   */
  public clearAllTransactions(): void {
    this.ledgerCache.clear();
    this.transactionsSubject.next([]);
    this.saveTransactionsToStorage([]);
  }

  /**
   * Get stored transactions from local storage
   */
  private getStoredTransactions(): Transaction[] {
    const stored = localStorage.getItem(this.TRANSACTIONS_KEY);
    // Key absent = genuinely new (or post-reset) user; seeding is correct.
    if (stored === null) {
      return [];
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const valid = parsed.filter(isValidTransaction).map(normalizeTransaction);
        // A non-empty stored array that yields no usable rows is corrupt, not "new" —
        // flag it so init resets both stores instead of silently reseeding cash.
        if (parsed.length > 0 && valid.length === 0) {
          this.storageWasCorrupt = true;
        }
        return valid;
      }
    } catch (error) {
      console.warn('Error reading transactions from localStorage:', error);
    }

    // Present but unparseable or not an array: corrupt, not a new user.
    this.storageWasCorrupt = true;
    return [];
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
    this.addTransactions([transaction]);
  }

  /**
   * Append one or more transactions as a single atomic update: persist to storage first,
   * then a single notify. Passing both legs of a transfer here (rather than two
   * addTransaction calls) guarantees a subscriber that throws mid-way cannot leave one
   * leg saved without the other, which would create or destroy money.
   */
  private addTransactions(newTransactions: Transaction[]): void {
    const updatedTransactions = [...this.transactionsSubject.value, ...newTransactions];
    this.ledgerCache.clear();
    // Persist BEFORE notifying (see addHoldingTransaction) so a throwing subscriber
    // can't drop the write.
    this.saveTransactionsToStorage(updatedTransactions);
    this.transactionsSubject.next(updatedTransactions);
  }

  /**
   * Add a transfer transaction from banking to brokerage
   */
  addTransferTransaction(amount: number, date: string): void {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0]; // Get HH:MM:SS format
    
    // Create two separate transactions - one for each account
    const bankingTransaction: Transaction = {
      type: "transaction",
      account: "banking001",
      amount: -amount, // Negative for banking (money going out)
      date: date,
      time: timeString,
      description: "Transfer to brokerage"
    };

    const brokerageTransaction: Transaction = {
      type: "transaction",
      account: "brokerage001",
      amount: amount, // Positive for brokerage (money coming in)
      date: date,
      time: timeString,
      description: "Transfer from banking"
    };

    this.addTransactions([bankingTransaction, brokerageTransaction]);
  }

  /**
   * Add a transfer transaction from brokerage to banking
   */
  addTransferToBankingTransaction(amount: number, date: string): void {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0]; // Get HH:MM:SS format
    
    // Create two separate transactions - one for each account
    const brokerageTransaction: Transaction = {
      type: "transaction",
      account: "brokerage001",
      amount: -amount, // Negative for brokerage (money going out)
      date: date,
      time: timeString,
      description: "Transfer to banking"
    };

    const bankingTransaction: Transaction = {
      type: "transaction",
      account: "banking001",
      amount: amount, // Positive for banking (money coming in)
      date: date,
      time: timeString,
      description: "Transfer from brokerage"
    };

    this.addTransactions([brokerageTransaction, bankingTransaction]);
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
      map((data: any) => data.transactions.filter((t: Transaction) => this.touchesAccount(t, accountId)))
    );
  }

  /**
   * Get transactions with running balances for a specific account (reactive)
   */
  getTransactionsWithRunningBalance$(accountId: string): Observable<Array<Transaction & { runningBalance: number, displayDescription: string }>> {
    return this.accountData$.pipe(
      map((data: any) => {
        // Transactions touching this account (already newest-first from accountData$).
        const accountTransactions = data.transactions.filter((t: Transaction) => this.touchesAccount(t, accountId));

        // Running balances, working backwards from the current balance.
        let runningBalance = data.balances[accountId] || 0;

        return accountTransactions.map((transaction: Transaction) => {
          const transactionAmount = this.signedAmount(transaction, accountId);
          let displayDescription = transaction.description;
          if (transaction.type === 'transfer') {
            displayDescription = transaction.account_from === accountId
              ? (transaction.description_from || transaction.description)
              : (transaction.description_to || transaction.description);
          }

          const balanceAfterTransaction = runningBalance;
          runningBalance -= transactionAmount;

          return {
            ...transaction,
            runningBalance: balanceAfterTransaction,
            displayDescription
          };
        });
      })
    );
  }

  // Memoized derived ledgers keyed by as-of date; invalidated whenever the base
  // transactions or holding transactions (which drive income) change.
  private ledgerCache = new Map<string, Transaction[]>();

  /**
   * Full derived ledger (base transactions + monthly interest + quarterly income),
   * filtered up to the given date. Single source for as-of balances and the statement.
   * Do not mutate the returned array.
   */
  getLedgerAsOf(date: string): Transaction[] {
    const cached = this.ledgerCache.get(date);
    if (cached) {
      return cached;
    }
    const base = this.transactionsSubject.value;
    // Income first, so settlement-cash interest accrues on dividend/bond income that is
    // sitting in the account too (it credits brokerage001 like any other cash).
    const income = this.generateIncomeTransactions(date);
    const interest = this.generateInterestTransactions([...base, ...income], date);
    const ledger = [...base, ...income, ...interest].filter(t => t.date <= date);
    this.ledgerCache.set(date, ledger);
    return ledger;
  }

  /** True if `tx` affects `accountId` -- as a regular entry on that account, or
   *  as either leg of a transfer. */
  private touchesAccount(tx: Transaction, accountId: string): boolean {
    if (tx.type === 'transfer') {
      return tx.account_from === accountId || tx.account_to === accountId;
    }
    return tx.account === accountId;
  }

  /** Signed amount `tx` contributes to `accountId`'s balance: a transfer debits
   *  account_from and credits account_to; a regular entry credits its account.
   *  The single definition of "how a transaction moves an account's money,"
   *  shared by the live balances, the as-of balance, and the activity views. */
  private signedAmount(tx: Transaction, accountId: string): number {
    if (tx.type === 'transfer') {
      if (tx.account_from === accountId) return -tx.amount;
      if (tx.account_to === accountId) return tx.amount;
      return 0;
    }
    return tx.account === accountId ? tx.amount : 0;
  }

  getBalanceAtDate(accountId: string, date: string): number {
    return this.getLedgerAsOf(date)
      .reduce((balance, tx) => balance + this.signedAmount(tx, accountId), 0);
  }

  /**
   * The most that may safely leave an account at `asOfDate`: the balance visible
   * at that date, further capped by the END-OF-SIM balance so a back-dated
   * transfer (possible after a teacher moves time backward) can never push the
   * account negative once later-dated transactions are counted again.
   */
  getMaxWithdrawable(accountId: string, asOfDate: string): number {
    return Math.max(0, Math.min(
      this.getBalanceAtDate(accountId, asOfDate),
      this.getBalanceAtDate(accountId, SIM_END)
    ));
  }

  private readonly INTEREST_TIME = '23:59:59';
  // Interest only accrues from the first playable quarter; the "Opening" period
  // (the seed deposit dated in December) earns nothing, so the student starts flat.
  private readonly INTEREST_START = SIM_YEAR_START;

  /**
   * Deterministically derive month-end interest entries for both accounts up to
   * `upToDate`. Interest compounds monthly on the prior balance. These entries are
   * never persisted — they are recomputed from the base transactions each time, so
   * accrual is idempotent across repeated quarter advances.
   */
  private generateInterestTransactions(baseTransactions: Transaction[], upToDate: string): Transaction[] {
    const interest: Transaction[] = [];

    (Object.keys(this.accounts) as Array<keyof typeof this.accounts>).forEach(accountId => {
      const account = this.accounts[accountId];
      // True APY: the monthly rate that compounds to EXACTLY the advertised annual
      // rate, (1 + apy)^(1/12) - 1. The nominal apy/12 compounds to slightly above
      // apy, so a student checking "1.50% APY on $5,000" would see too much interest.
      const monthlyRate = Math.pow(1 + account.apy, 1 / 12) - 1;
      if (monthlyRate <= 0) {
        return;
      }

      const accountTx = baseTransactions
        .filter(t => t.account === accountId)
        .sort((a, b) => a.date.localeCompare(b.date));
      if (accountTx.length === 0) {
        return;
      }

      let year = parseInt(accountTx[0].date.slice(0, 4), 10);
      let month = parseInt(accountTx[0].date.slice(5, 7), 10) - 1; // 0-indexed
      const endYear = parseInt(upToDate.slice(0, 4), 10);
      const endMonth = parseInt(upToDate.slice(5, 7), 10) - 1;

      let accrued = 0;
      while (year < endYear || (year === endYear && month <= endMonth)) {
        const monthEnd = this.lastDayOfMonth(year, month);
        if (monthEnd <= upToDate && monthEnd >= this.INTEREST_START) {
          const baseBalance = account.initialBalance + accountTx
            .filter(t => t.date <= monthEnd)
            .reduce((sum, t) => sum + t.amount, 0);
          const balance = baseBalance + accrued;
          if (balance > 0) {
            const amount = Math.round(balance * monthlyRate * 100) / 100;
            if (amount > 0) {
              interest.push({
                type: 'interest',
                account: accountId,
                amount,
                date: monthEnd,
                time: this.INTEREST_TIME,
                description: 'Interest payment'
              });
              accrued += amount;
            }
          }
        }
        month += 1;
        if (month > 11) {
          month = 0;
          year += 1;
        }
      }
    });

    return interest;
  }

  private lastDayOfMonth(year: number, monthIndex0: number): string {
    const day = new Date(year, monthIndex0 + 1, 0).getDate();
    const mm = String(monthIndex0 + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

  // Quarter-end dates used for dividend / bond-income posting (from quarters.data).
  private readonly QUARTER_ENDS = PAYING_QUARTER_ENDS;

  /**
   * Derive quarterly income — dividends (equities/funds) and bond-fund income (30-day
   * SEC yield) — paid as cash into the settlement account. Not persisted, so it's
   * idempotent across quarter advances. Cash only; no reinvestment.
   */
  private generateIncomeTransactions(upToDate: string): Transaction[] {
    const income: Transaction[] = [];
    for (const quarterEnd of this.QUARTER_ENDS) {
      if (quarterEnd > upToDate) {
        continue;
      }
      for (const asset of this.dataService.assets) {
        const shares = this.holdingsService.getSharesOwned(asset.id, quarterEnd);
        if (shares <= 0) {
          continue;
        }
        const isBond = asset.type === 'bond_fund';
        const rate = isBond ? (asset.secYield ?? 0) : (asset.dividendYield ?? 0);
        if (rate <= 0) {
          continue;
        }
        const price = this.holdingsService.getCurrentPrice(asset, quarterEnd);
        const amount = Math.round(shares * price * (rate / 4) * 100) / 100;
        if (amount <= 0) {
          continue;
        }
        income.push({
          type: 'income',
          account: 'brokerage001',
          amount,
          date: quarterEnd,
          time: '23:59:58',
          description: isBond ? `Bond fund income: ${asset.name}` : `Dividend: ${asset.name}`
        });
      }
    }
    return income;
  }

}
