import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule, MatTabGroup } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DataService } from '../../shared/services/data.service';
import { TransactionsService, Transaction } from '../../shared/services/transactions.service';
import { HoldingsService } from '../../shared/services/holdings.service';
import { CurrentDateService } from '../../shared/services/current-date.service';
import { TransferDialogComponent } from '../banking/transfer-dialog.component';
import { AssetTypePipe } from '../../shared/pipes/asset-type.pipe';
import { PlaceTradeComponent, TradeData } from './place-trade.component';

export interface Holding {
  asset: string;
  shares: number;
  price: number;
  value: number;
  gainLoss: number;
  gainLossPercent: number;
}

@Component({
  selector: 'app-investing',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatDialogModule, MatExpansionModule, MatFormFieldModule, MatInputModule, MatRadioModule, MatSelectModule, MatSlideToggleModule, MatTableModule, MatTabsModule, FormsModule, PlaceTradeComponent, AssetTypePipe],
  templateUrl: './investing.component.html',
  styleUrl: './investing.component.scss'
})
export class InvestingComponent implements OnInit, OnDestroy {
  @ViewChild('tabGroup') tabGroup!: MatTabGroup;
  
  brokerageBalance: number = 0;
  bankingBalance: number = 0;
  currentDate: string = '2025-01-01';
  transactions: Array<Transaction & { runningBalance: number, displayDescription: string }> = [];
  
  // Holdings data from HoldingsService
  holdings: any[] = [];
  
  // Holding transactions for Activity tab
  holdingTransactions: any[] = [];
  
  // Asset type allocation percentages
  assetTypeAllocation: Array<{type: string, percentage: number, value: number}> = [];
  
  displayedColumns: string[] = ['asset', 'shares', 'price', 'value'];

  // Quarterly statements data
  quarterlyStatements = [
    {
      quarter: 'Q1 2025',
      period: 'January 1 - March 31, 2025',
      beginningBalance: 0,
      endingBalance: 5000,
      trades: [
        { date: '2025-01-15', action: 'Buy', asset: 'AAPL', shares: 10, price: 150.00, amount: 1500.00 },
        { date: '2025-02-10', action: 'Buy', asset: 'MSFT', shares: 5, price: 300.00, amount: 1500.00 },
        { date: '2025-03-05', action: 'Buy', asset: 'GOOGL', shares: 3, price: 2500.00, amount: 7500.00 }
      ],
      dividends: 0,
      interest: 0,
      fees: 15.00,
      netGainLoss: 5000,
      totalReturn: 0
    },
    {
      quarter: 'Q2 2025',
      period: 'April 1 - June 30, 2025',
      beginningBalance: 5000,
      endingBalance: 12000,
      trades: [
        { date: '2025-04-20', action: 'Buy', asset: 'TSLA', shares: 2, price: 200.00, amount: 400.00 },
        { date: '2025-05-15', action: 'Sell', asset: 'AAPL', shares: 5, price: 160.00, amount: 800.00 }
      ],
      dividends: 25.00,
      interest: 0,
      fees: 10.00,
      netGainLoss: 7000,
      totalReturn: 140.00
    }
  ];
  
  private subscription = new Subscription();

  constructor(public dataService: DataService, public transactionsService: TransactionsService, public holdingsService: HoldingsService, public currentDateService: CurrentDateService, private dialog: MatDialog) {}

  ngOnInit(): void {
    // Subscribe to current date
    this.subscription.add(
      this.currentDateService.currentDate$.subscribe(date => {
        this.currentDate = date;
      })
    );

    // Subscribe to account balance
    this.subscription.add(
      this.transactionsService.getCurrentBalance$('brokerage001').subscribe(balance => {
        this.brokerageBalance = balance;
      })
    );

    // Subscribe to banking balance
    this.subscription.add(
      this.transactionsService.getCurrentBalance$('banking001').subscribe(balance => {
        this.bankingBalance = balance;
      })
    );

    // Subscribe to transactions with running balances
    this.subscription.add(
      this.transactionsService.getTransactionsWithRunningBalance$('brokerage001').subscribe(transactions => {
        this.transactions = transactions;
      })
    );

    // Subscribe to holdings data
    this.subscription.add(
      this.holdingsService.holdings$.subscribe(holdings => {
        this.holdings = holdings;
        this.calculateAssetTypeAllocation();
      })
    );

    // Subscribe to holding transactions for Activity tab
    this.subscription.add(
      this.holdingsService.holdingTransactions$.subscribe(transactions => {
        // Sort transactions in descending order by date (most recent first)
        this.holdingTransactions = transactions.sort((a, b) => {
          // Sort by date descending, then by time descending for same date
          const dateComparison = b.date.localeCompare(a.date);
          if (dateComparison !== 0) {
            return dateComparison;
          }
          // If dates are the same, sort by time descending
          return b.time.localeCompare(a.time);
        });
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getTransactionAmount(transaction: Transaction & { runningBalance: number, displayDescription: string }): number {
    if (transaction.type === 'transfer') {
      // For transfers, show the amount from brokerage account's perspective
      if (transaction.account_from === 'brokerage001') {
        return -transaction.amount; // Money going out
      } else if (transaction.account_to === 'brokerage001') {
        return transaction.amount; // Money coming in
      }
    }
    return transaction.amount;
  }

  openWithdrawDialog(): void {
    const dialogRef = this.dialog.open(TransferDialogComponent, {
      width: '400px',
      data: { 
        maxAmount: this.brokerageBalance,
        currentDate: this.currentDate,
        transferDirection: 'to-banking' as const
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.amount > 0) {
            this.transactionsService.addTransferToBankingTransaction(result.amount, this.currentDate);
      }
    });
  }

  openAddFundsDialog(): void {
    const dialogRef = this.dialog.open(TransferDialogComponent, {
      width: '400px',
      data: { 
        maxAmount: this.bankingBalance, // Use actual banking balance
        currentDate: this.currentDate,
        transferDirection: 'to-brokerage' as const
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.amount > 0) {
            this.transactionsService.addTransferTransaction(result.amount, this.currentDate);
      }
    });
  }

  onSubmitTrade(tradeData: TradeData): void {
    console.log('Trade submitted:', tradeData);
    // TODO: Integrate with HoldingsService to process the trade
  }

  processTrade(tradeData: TradeData): void {
    console.log('Processing trade:', tradeData);
    
    // Get the asset and current price
    const asset = this.dataService.getAssetById(tradeData.assetId);
    if (!asset) {
      console.error('Asset not found:', tradeData.assetId);
      return;
    }
    
    const currentPrice = this.holdingsService.getCurrentPrice(asset, this.currentDate);
    if (currentPrice <= 0) {
      console.error('Invalid current price for asset:', tradeData.assetId, currentPrice);
      return;
    }
    
    // Add holding transaction
    this.holdingsService.addHoldingTransaction(
      tradeData.assetId,
      tradeData.action.toLowerCase() as 'buy' | 'sell',
      tradeData.shares,
      currentPrice,
      this.currentDate
    );
    
    // Add corresponding brokerage transaction using the new method
    this.transactionsService.addTradeTransaction(
      'brokerage001',
      tradeData.assetId,
      tradeData.action.toLowerCase() as 'buy' | 'sell',
      tradeData.shares,
      currentPrice,
      this.currentDate,
      asset.name,
      asset.type
    );
    
    console.log('Trade processed successfully');
  }

  // Get asset name for holding transaction
  getAssetName(assetId: string): string {
    const asset = this.dataService.getAssetById(assetId);
    return asset ? asset.name : assetId;
  }

  // Get asset type for holding transaction
  getAssetType(assetId: string): string {
    const asset = this.dataService.getAssetById(assetId);
    return asset ? asset.type : '';
  }

  // Get running balance for this asset up to this transaction
  getRunningBalance(transaction: any): number {
    // Calculate running balance for this asset up to this transaction
    const assetId = transaction.assetId;
    const transactionDate = transaction.date;
    const transactionTime = transaction.time;
    
    // Get all transactions for this asset up to and including this transaction
    const relevantTransactions = this.holdingTransactions
      .filter(t => 
        t.assetId === assetId && 
        (t.date < transactionDate || (t.date === transactionDate && t.time <= transactionTime))
      )
      .sort((a, b) => {
        const dateComparison = a.date.localeCompare(b.date);
        if (dateComparison !== 0) {
          return dateComparison;
        }
        return a.time.localeCompare(b.time);
      });
    
    // Calculate running balance
    let runningBalance = 0;
    for (const t of relevantTransactions) {
      if (t.action === 'buy') {
        runningBalance += t.shares;
      } else if (t.action === 'sell') {
        runningBalance -= t.shares;
      }
    }
    
    return Math.max(0, runningBalance); // Ensure we don't return negative shares
  }

  // Calculate asset type allocation percentages
  calculateAssetTypeAllocation(): void {
    // Define all possible asset types
    const allAssetTypes = ['stock', 'mutual_fund', 'index_fund', 'etf', 'target_date_fund', 'bond_fund'];
    
    // Initialize all types with 0 values
    const typeTotals: { [type: string]: number } = {};
    allAssetTypes.forEach(type => {
      typeTotals[type] = 0;
    });
    
    let totalValue = 0;

    // Calculate totals for holdings that exist
    for (const holding of this.holdings) {
      const asset = this.dataService.getAssetById(holding.assetId);
      if (asset) {
        const type = asset.type;
        typeTotals[type] += holding.value;
        totalValue += holding.value;
      }
    }

    // Calculate percentages and create allocation array for all types
    this.assetTypeAllocation = allAssetTypes
      .map(type => ({
        type,
        value: typeTotals[type],
        percentage: totalValue > 0 ? (typeTotals[type] / totalValue) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending
  }

  // Handle trade completion - navigate to Activity tab
  onTradeCompleted(): void {
    // Switch to Activity tab (index 2: Dashboard=0, Place Trade=1, Activity=2)
    this.tabGroup.selectedIndex = 2;
  }
}
