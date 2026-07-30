import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { CurrentDateService } from './current-date.service';
import { ASSETS, Asset } from '../data/assets.data';
import { SIM_END } from '../data/quarters.data';

export interface HoldingTransaction {
  assetId: string;
  action: 'buy' | 'sell';
  shares: number;
  price: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
}

export interface RealizedSale {
  assetId: string;
  date: string;
  time: string;
  shares: number;
  proceeds: number;
  costBasis: number;
  gain: number;
  term: 'short' | 'long';
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
          const asset = this.getAssetById(assetId);
          if (!asset) return; // Skip if asset not found

          // FIFO cost basis: remaining shares and their original cost
          const { remainingShares, remainingCost } = this.replayLots(assetTransactions[assetId]);

          // Only include assets with positive shares
          if (remainingShares > 0.0000005) {
            const currentPrice = this.getCurrentPrice(asset, currentDate);
            const currentValue = remainingShares * currentPrice;
            const gainLoss = currentValue - remainingCost;
            const gainLossPercent = remainingCost > 0 ? (gainLoss / remainingCost) * 100 : 0;

            holdings.push({
              assetId: assetId,
              name: asset.name,
              shares: remainingShares,
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
    // Millisecond precision: two sells of the same asset in the same wall-clock second
    // would otherwise share an assetId|date|time key and collide in the realized-gain
    // feed, so one row would show the other sale's gain/loss.
    const timeString = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;

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
    this.detailsCache.clear();
    // Persist BEFORE notifying: subscribers run synchronously on next(), and if one
    // throws (e.g. a chart error) the exception would otherwise unwind before the save,
    // losing the write. Saving first guarantees the transaction is durable.
    this.saveHoldingTransactionsToStorage(updatedHoldingTransactions);
    this.holdingTransactionsSubject.next(updatedHoldingTransactions);
  }

  /**
   * Get current price for an asset on a specific date
   */
  public getCurrentPrice(asset: Asset, date: string): number {
    // First, try to find an exact date match
    const exactMatch = asset.historicalPerformance.find(point => point.date === date);
    if (exactMatch) {
      return exactMatch.value;
    }
    
    // If no exact match, find the closest historical performance point on or before the date
    const performancePoints = asset.historicalPerformance
      .filter(point => point.date <= date)
      .sort((a, b) => b.date.localeCompare(a.date)); // Sort descending to get most recent first
    
    if (performancePoints.length > 0) {
      return performancePoints[0].value;
    }
    
    // If no historical data before the date, find the closest point after the date
    const futurePoints = asset.historicalPerformance
      .filter(point => point.date > date)
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort ascending to get earliest first
    
    if (futurePoints.length > 0) {
      return futurePoints[0].value;
    }
    
    // Fallback to most recent price if no historical data
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
   * Replay an asset's buys/sells in FIFO order. Returns the remaining share count
   * and the original cost of those remaining shares, plus realized sales (each with
   * gain/loss and a short-/long-term flag). Single source for cost basis + gains.
   */
  private replayLots(transactions: HoldingTransaction[]): { remainingShares: number; remainingCost: number; realized: RealizedSale[] } {
    const sorted = [...transactions].sort((a, b) =>
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
    );
    const lots: Array<{ shares: number; price: number; date: string }> = [];
    const realized: RealizedSale[] = [];

    for (const t of sorted) {
      if (t.action === 'buy') {
        lots.push({ shares: t.shares, price: t.price, date: t.date });
      } else {
        let toSell = t.shares;
        let costBasis = 0;
        let allLong = true;
        while (toSell > 1e-9 && lots.length > 0) {
          const lot = lots[0];
          const take = Math.min(lot.shares, toSell);
          costBasis += take * lot.price;
          if (!this.isLongTerm(lot.date, t.date)) {
            allLong = false;
          }
          lot.shares -= take;
          toSell -= take;
          if (lot.shares <= 1e-9) {
            lots.shift();
          }
        }
        // Clamp to the shares actually covered by lots. An oversell (more sold than
        // ever bought — possible only via inconsistent data) must not fabricate
        // gain against a zero cost basis.
        const sharesSold = t.shares - Math.max(0, toSell);
        if (toSell > 1e-9) {
          console.warn(`Oversell detected for ${t.assetId} on ${t.date}: ${t.shares} sold, only ${sharesSold.toFixed(6)} covered by lots.`);
        }
        const proceeds = sharesSold * t.price;
        realized.push({
          assetId: t.assetId,
          date: t.date,
          time: t.time,
          shares: sharesSold,
          proceeds,
          costBasis,
          gain: proceeds - costBasis,
          term: allLong ? 'long' : 'short'
        });
      }
    }

    const remainingShares = lots.reduce((sum, l) => sum + l.shares, 0);
    const remainingCost = lots.reduce((sum, l) => sum + l.shares * l.price, 0);
    return { remainingShares, remainingCost, realized };
  }

  private isLongTerm(buyDate: string, sellDate: string): boolean {
    // Pure string math on YYYY-MM-DD (timezone-free): long-term = held MORE than
    // one calendar year. Lexicographic comparison is valid for ISO dates.
    const oneYearLater = `${parseInt(buyDate.slice(0, 4), 10) + 1}${buyDate.slice(4)}`;
    return sellDate > oneYearLater;
  }

  /**
   * The most shares a sell at `asOfDate` may safely take: the position visible at
   * that date, further capped by the END-OF-SIM net position so a back-dated sell
   * (possible after a teacher moves time backward) can never push the all-time
   * position negative once later-dated sells are counted again.
   */
  public getMaxSellableShares(assetId: string, asOfDate: string): number {
    return Math.max(0, Math.min(
      this.getSharesOwned(assetId, asOfDate),
      this.getSharesOwned(assetId, SIM_END)
    ));
  }

  /**
   * Realized sales (FIFO) across all assets up to the given date — used to surface
   * short-/long-term gains on the Activity feed and the statement.
   */
  public getRealizedSales(asOfDate: string): RealizedSale[] {
    const byAsset: { [assetId: string]: HoldingTransaction[] } = {};
    this.holdingTransactionsSubject.value
      .filter(t => t.date <= asOfDate)
      .forEach(t => {
        (byAsset[t.assetId] = byAsset[t.assetId] || []).push(t);
      });

    const all: RealizedSale[] = [];
    Object.keys(byAsset).forEach(assetId => {
      all.push(...this.replayLots(byAsset[assetId]).realized);
    });
    return all;
  }

  /**
   * Get asset by ID
   */
  getAssetById(id: string): Asset | undefined {
    return this.assets.find(a => a.id === id);
  }

  /**
   * Get holdings at a specific date
   */
  getHoldingsAtDate(date: string): any[] {
    const allTransactions = this.holdingTransactionsSubject.value;
    const holdingsMap = new Map<string, any>();

    // Process all transactions up to the specified date
    allTransactions
      .filter(tx => tx.date <= date)
      .forEach(tx => {
        const key = tx.assetId;
        if (!holdingsMap.has(key)) {
          holdingsMap.set(key, { assetId: key, shares: 0 });
        }
        
        const holding = holdingsMap.get(key);
        if (tx.action === 'buy') {
          holding.shares += tx.shares;
        } else if (tx.action === 'sell') {
          holding.shares -= tx.shares;
        }
      });

    // Return only holdings with positive shares
    return Array.from(holdingsMap.values()).filter(h => h.shares > 0);
  }

  // Memoized per-date holding details (FIFO replays are the app's hottest math);
  // invalidated whenever a holding transaction is added.
  private detailsCache = new Map<string, Array<{ assetId: string; name: string; type: string; shares: number; price: number; value: number; costBasis: number; gainLoss: number; }>>();

  /** Per-asset holding detail as of a date, with FIFO cost basis ("what you paid"). Do not mutate the result. */
  getHoldingDetailsAtDate(date: string): Array<{ assetId: string; name: string; type: string; shares: number; price: number; value: number; costBasis: number; gainLoss: number; }> {
    const cached = this.detailsCache.get(date);
    if (cached) {
      return cached;
    }
    const byAsset: { [assetId: string]: HoldingTransaction[] } = {};
    this.holdingTransactionsSubject.value
      .filter(t => t.date <= date)
      .forEach(t => {
        (byAsset[t.assetId] = byAsset[t.assetId] || []).push(t);
      });

    const details: Array<{ assetId: string; name: string; type: string; shares: number; price: number; value: number; costBasis: number; gainLoss: number; }> = [];
    Object.keys(byAsset).forEach(assetId => {
      const asset = this.getAssetById(assetId);
      if (!asset) return;
      const { remainingShares, remainingCost } = this.replayLots(byAsset[assetId]);
      if (remainingShares > 0.0000005) {
        const price = this.getCurrentPrice(asset, date);
        const value = remainingShares * price;
        details.push({
          assetId,
          name: asset.name,
          type: asset.type,
          shares: remainingShares,
          price,
          value,
          costBasis: remainingCost,
          gainLoss: value - remainingCost
        });
      }
    });
    this.detailsCache.set(date, details);
    return details;
  }

  /** Total invested value (excludes cash) as of a date. */
  getInvestmentsValueAtDate(date: string): number {
    return this.getHoldingDetailsAtDate(date).reduce((sum, h) => sum + h.value, 0);
  }

  /** Raw holding (buy/sell) transactions — snapshot. */
  getAllHoldingTransactions(): HoldingTransaction[] {
    return this.holdingTransactionsSubject.value;
  }
}
