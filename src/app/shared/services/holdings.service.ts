import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { CurrentDateService } from './current-date.service';
import { ASSETS, Asset } from '../data/assets.data';

export interface HoldingTransaction {
  assetId: string;
  action: 'buy' | 'sell';
  shares: number;
  price: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
}

@Injectable({
  providedIn: 'root'
})
export class HoldingsService {
  private readonly HOLDING_TX_KEY = 'investing_sim__holding_transactions';
  
  // Assets data
  public assets: Asset[] = ASSETS;

  // Holding Transactions BehaviorSubject
  private holdingTransactionsSubject = new BehaviorSubject<HoldingTransaction[]>(this.getStoredHoldingTransactions());
  public holdingTransactions$ = this.holdingTransactionsSubject.asObservable();

  // Holdings observable that computes current holdings based on transactions and current date
  public holdings$: Observable<any>;

  constructor(private currentDateService: CurrentDateService) {
    // Initialize with stored holding transactions
    this.initializeHoldingTransactions();
    // Ensure holding transactions are saved to localStorage
    this.ensureLocalStorageInitialized();
    
    // Initialize holdings observable that depends on CurrentDateService
    this.holdings$ = combineLatest([
      this.currentDateService.currentDate$,
      this.holdingTransactions$
    ]).pipe(
      map(([currentDate, holdingTransactions]) => {
        // Filter transactions up to current date
        const filteredTransactions = holdingTransactions.filter(t => t.date <= currentDate);
        
        // Group transactions by asset
        const assetTransactions: { [assetId: string]: HoldingTransaction[] } = {};
        filteredTransactions.forEach(transaction => {
          if (!assetTransactions[transaction.assetId]) {
            assetTransactions[transaction.assetId] = [];
          }
          assetTransactions[transaction.assetId].push(transaction);
        });

        // Compute holdings for each asset
        const holdings: Array<{
          assetId: string;
          name: string;
          shares: number;
          price: number;
          value: number;
          gainLoss: number;
          gainLossPercent: number;
        }> = [];

        Object.keys(assetTransactions).forEach(assetId => {
          const transactions = assetTransactions[assetId];
          const asset = this.getAssetById(assetId);
          
          if (!asset) return; // Skip if asset not found

          // Compute net shares and cost basis
          let totalShares = 0;
          let totalCost = 0;
          
          transactions.forEach(transaction => {
            if (transaction.action === 'buy') {
              totalShares += transaction.shares;
              totalCost += transaction.shares * transaction.price;
            } else if (transaction.action === 'sell') {
              totalShares -= transaction.shares;
              // Reduce cost basis proportionally
              if (totalShares > 0) {
                totalCost = (totalCost * totalShares) / (totalShares + transaction.shares);
              } else {
                totalCost = 0; // Reset if shares go to 0
              }
            }
          });

          // Only include assets with positive shares
          if (totalShares > 0) {
            // Get current price from historical performance
            const currentPrice = this.getCurrentPrice(asset, currentDate);
            const currentValue = totalShares * currentPrice;
            const costBasis = totalCost;
            const gainLoss = currentValue - costBasis;
            const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

            holdings.push({
              assetId: assetId,
              name: asset.name,
              shares: totalShares,
              price: currentPrice,
              value: currentValue,
              gainLoss: gainLoss,
              gainLossPercent: gainLossPercent
            });
          }
        });

        return holdings;
      })
    );
  }

  /**
   * Initialize holding transactions from local storage
   */
  private initializeHoldingTransactions(): void {
    const storedHoldingTransactions = this.getStoredHoldingTransactions();
    this.holdingTransactionsSubject.next(storedHoldingTransactions);
  }

  /**
   * Ensure localStorage is properly initialized with default values
   */
  private ensureLocalStorageInitialized(): void {
    // Ensure holding transactions are saved
    const currentHoldingTransactions = this.holdingTransactionsSubject.value;
    this.saveHoldingTransactionsToStorage(currentHoldingTransactions);
  }

  /**
   * Get stored holding transactions from local storage
   */
  private getStoredHoldingTransactions(): HoldingTransaction[] {
    try {
      const stored = localStorage.getItem(this.HOLDING_TX_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Error reading holding transactions from localStorage:', error);
    }
    
    // Default empty array for holding transactions
    return [];
  }

  /**
   * Save holding transactions to local storage
   */
  private saveHoldingTransactionsToStorage(transactions: HoldingTransaction[]): void {
    try {
      localStorage.setItem(this.HOLDING_TX_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving holding transactions to localStorage:', error);
    }
  }

  /**
   * Add a holding transaction (buy/sell)
   */
  addHoldingTransaction(assetId: string, action: 'buy' | 'sell', shares: number, price: number, date: string): void {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0]; // Get HH:MM:SS format
    
    const holdingTransaction: HoldingTransaction = {
      assetId: assetId,
      action: action,
      shares: shares,
      price: price,
      date: date,
      time: timeString
    };

    const currentHoldingTransactions = this.holdingTransactionsSubject.value;
    const updatedHoldingTransactions = [...currentHoldingTransactions, holdingTransaction];
    this.holdingTransactionsSubject.next(updatedHoldingTransactions);
    this.saveHoldingTransactionsToStorage(updatedHoldingTransactions);
  }

  /**
   * Get current price for an asset on a specific date
   */
  public getCurrentPrice(asset: Asset, date: string): number {
    // Find the closest historical performance point on or before the date
    const performancePoints = asset.historicalPerformance
      .filter(point => point.date <= date)
      .sort((a, b) => b.date.localeCompare(a.date)); // Sort descending to get most recent first
    
    if (performancePoints.length > 0) {
      return performancePoints[0].value;
    }
    
    // Fallback to most recent price if no historical data for the date
    const allPoints = asset.historicalPerformance
      .sort((a, b) => b.date.localeCompare(a.date));
    
    return allPoints.length > 0 ? allPoints[0].value : 0;
  }

  /**
   * Get the number of shares owned for a specific asset up to a given date
   */
  public getSharesOwned(assetId: string, asOfDate: string): number {
    const holdingTransactions = this.holdingTransactionsSubject.value;
    
    // Filter transactions for this asset up to the given date
    const relevantTransactions = holdingTransactions
      .filter(transaction => 
        transaction.assetId === assetId && 
        transaction.date <= asOfDate
      )
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date ascending
    
    // Calculate net shares owned
    let totalShares = 0;
    for (const transaction of relevantTransactions) {
      if (transaction.action === 'buy') {
        totalShares += transaction.shares;
      } else if (transaction.action === 'sell') {
        totalShares -= transaction.shares;
      }
    }
    
    return Math.max(0, totalShares); // Ensure we don't return negative shares
  }

  /**
   * Get asset by ID
   */
  getAssetById(id: string): Asset | undefined {
    return this.assets.find(a => a.id === id);
  }
}
