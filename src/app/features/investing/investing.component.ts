import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DataService } from '../../shared/services/data.service';
import { TransactionsService, Transaction } from '../../shared/services/transactions.service';
import { HoldingsService } from '../../shared/services/holdings.service';
import { CurrentDateService } from '../../shared/services/current-date.service';
import { TransferDialogComponent } from '../banking/transfer-dialog.component';

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
  imports: [CommonModule, MatButtonModule, MatCardModule, MatDialogModule, MatExpansionModule, MatFormFieldModule, MatInputModule, MatRadioModule, MatSelectModule, MatSlideToggleModule, MatTableModule, MatTabsModule, FormsModule],
  templateUrl: './investing.component.html',
  styleUrl: './investing.component.scss'
})
export class InvestingComponent implements OnInit, OnDestroy {
  brokerageBalance: number = 0;
  currentDate: string = '2025-01-01';
  transactions: Array<Transaction & { runningBalance: number, displayDescription: string }> = [];
  
  // Holdings data from HoldingsService
  holdings: any[] = [];
  
  displayedColumns: string[] = ['asset', 'shares', 'price', 'value', 'gainLoss'];
  
  // Trading form properties
  selectedAsset: string = '';
  isBuy: boolean = true;
  inputType: string = 'shares';
  tradeAmount: number | null = null;
  
  // Mock asset options
  assetOptions = [
    { value: 'AAPL', label: 'Apple Inc. (AAPL)' },
    { value: 'MSFT', label: 'Microsoft Corp. (MSFT)' },
    { value: 'GOOGL', label: 'Alphabet Inc. (GOOGL)' }
  ];

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

  openTransferDialog(): void {
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

  onSubmitTrade(): void {
    if (this.selectedAsset && this.tradeAmount !== null && this.tradeAmount > 0) {
      const tradeData = {
        asset: this.selectedAsset,
        action: this.isBuy ? 'Buy' : 'Sell',
        inputType: this.inputType,
        amount: this.tradeAmount,
        timestamp: new Date().toISOString()
      };
      
      console.log('Trade submitted:', tradeData);
      
      // Reset form
      this.selectedAsset = '';
      this.tradeAmount = null;
    }
  }

  isTradeFormValid(): boolean {
    return this.selectedAsset !== '' && 
           this.tradeAmount !== null && 
           this.tradeAmount > 0;
  }
}
