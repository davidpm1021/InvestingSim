import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../../shared/services/data.service';
import { TransactionsService, Transaction } from '../../shared/services/transactions.service';
import { HoldingsService } from '../../shared/services/holdings.service';
import { AssetTypePipe } from '../../shared/pipes/asset-type.pipe';
import { EvergreenDatePipe } from '../../shared/pipes/evergreen-date.pipe';
import { DefineComponent } from '../../shared/components/define/define.component';
import { SIM_YEAR_START } from '../../shared/data/quarters.data';

export interface StatementDialogData {
  quarter: any; // { start, end, label, ... }
  currentDate: string;
}

@Component({
  selector: 'app-statement-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, AssetTypePipe, EvergreenDatePipe, DefineComponent],
  templateUrl: './statement-dialog.component.html',
  styleUrl: './statement-dialog.component.scss'
})
export class StatementDialogComponent implements OnInit {
  model: any = null;
  showHowToRead = false;

  // The simulation "year" begins at the first playable quarter (evergreen: no year shown).
  private readonly YEAR_START = SIM_YEAR_START;

  constructor(
    public dialogRef: MatDialogRef<StatementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StatementDialogData,
    private dataService: DataService,
    private transactionsService: TransactionsService,
    private holdingsService: HoldingsService
  ) {}

  ngOnInit(): void {
    this.model = this.buildStatement(this.data.quarter);
  }

  close(): void {
    this.dialogRef.close();
  }

  private buildStatement(quarter: any): any {
    const qStart: string = quarter.start;
    const qEnd: string = quarter.end;
    const prevEnd = this.dayBefore(qStart);
    const yearPrevEnd = this.dayBefore(this.YEAR_START);

    // Account balances (the brokerage account)
    const startCash = this.transactionsService.getBalanceAtDate('brokerage001', prevEnd);
    const endCash = this.transactionsService.getBalanceAtDate('brokerage001', qEnd);
    const startInv = this.holdingsService.getInvestmentsValueAtDate(prevEnd);
    const endInv = this.holdingsService.getInvestmentsValueAtDate(qEnd);
    const startValue = startCash + startInv;
    const endValue = endCash + endInv;

    const ytdStartCash = this.transactionsService.getBalanceAtDate('brokerage001', yearPrevEnd);
    const ytdStartInv = this.holdingsService.getInvestmentsValueAtDate(yearPrevEnd);
    const ytdStartValue = ytdStartCash + ytdStartInv;

    // Cash flows for the quarter and year-to-date
    const ledger = this.transactionsService.getLedgerAsOf(qEnd).filter(t => t.account === 'brokerage001');
    const qActivity = ledger.filter(t => t.date >= qStart && t.date <= qEnd);
    const ytdActivity = ledger.filter(t => t.date >= this.YEAR_START && t.date <= qEnd);
    const qFlow = this.summarizeFlow(qActivity);
    const ytdFlow = this.summarizeFlow(ytdActivity);

    const moneyAddedQ = qFlow.deposits - qFlow.withdrawals;
    const moneyAddedYtd = ytdFlow.deposits - ytdFlow.withdrawals;

    // Investment gain/loss is the residual, so Starting + Added + Gain/Loss = Ending always reconciles.
    const changeInValue = {
      startingBalance: { q: startValue, ytd: ytdStartValue },
      moneyAdded: { q: moneyAddedQ, ytd: moneyAddedYtd },
      gainLoss: { q: endValue - startValue - moneyAddedQ, ytd: endValue - ytdStartValue - moneyAddedYtd },
      endingBalance: { q: endValue, ytd: endValue }
    };

    const cashActivity = {
      startingCash: { q: startCash, ytd: ytdStartCash },
      deposits: { q: qFlow.deposits, ytd: ytdFlow.deposits },
      withdrawals: { q: qFlow.withdrawals, ytd: ytdFlow.withdrawals },
      purchased: { q: qFlow.purchased, ytd: ytdFlow.purchased },
      sold: { q: qFlow.sold, ytd: ytdFlow.sold },
      dividends: { q: qFlow.dividends, ytd: ytdFlow.dividends },
      interest: { q: qFlow.interest, ytd: ytdFlow.interest },
      endingCash: { q: endCash, ytd: endCash }
    };

    const depositsWithdrawals = qActivity
      .filter(t => t.type === 'transaction')
      .map(t => ({
        date: t.date,
        type: t.amount >= 0 ? 'Deposit' : 'Withdrawal',
        description: t.description,
        amount: t.amount
      }));

    const holdings = this.holdingsService.getHoldingDetailsAtDate(qEnd).map(h => ({
      ...h,
      pctOfPortfolio: endValue > 0 ? (h.value / endValue) * 100 : 0
    }));

    const { stocks, bonds } = this.dataService.getAssetClassTotals(holdings);
    const breakdown = [
      { label: 'Stocks', value: stocks, pct: endValue > 0 ? (stocks / endValue) * 100 : 0 },
      { label: 'Bonds', value: bonds, pct: endValue > 0 ? (bonds / endValue) * 100 : 0 },
      { label: 'Cash', value: endCash, pct: endValue > 0 ? (endCash / endValue) * 100 : 0 }
    ];

    const trades = this.holdingsService.getAllHoldingTransactions()
      .filter(t => t.date >= qStart && t.date <= qEnd)
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
      .map(t => {
        const asset = this.dataService.getAssetById(t.assetId);
        const total = t.shares * t.price;
        return {
          date: t.date,
          action: t.action === 'buy' ? 'Buy' : 'Sell',
          name: asset ? asset.name : t.assetId,
          shares: t.shares,
          price: t.price,
          total: t.action === 'buy' ? -total : total
        };
      });

    return {
      periodStart: qStart,
      periodEnd: qEnd,
      generated: this.dayAfter(qEnd),
      changeInValue,
      cashAvailable: { start: startCash, end: endCash },
      investments: { start: startInv, end: endInv },
      cashActivity,
      depositsWithdrawals,
      holdings,
      breakdown,
      trades
    };
  }

  private summarizeFlow(activity: Transaction[]): { deposits: number; withdrawals: number; purchased: number; sold: number; dividends: number; interest: number; } {
    let deposits = 0, withdrawals = 0, purchased = 0, sold = 0, dividends = 0, interest = 0;
    for (const t of activity) {
      if (t.type === 'transaction') {
        if (t.amount >= 0) { deposits += t.amount; } else { withdrawals += -t.amount; }
      } else if (t.type === 'trade') {
        if (t.amount < 0) { purchased += t.amount; } else { sold += t.amount; }
      } else if (t.type === 'income') {
        dividends += t.amount;
      } else if (t.type === 'interest') {
        interest += t.amount;
      }
    }
    return { deposits, withdrawals, purchased, sold, dividends, interest };
  }

  private dayBefore(dateString: string): string {
    return this.shiftDate(dateString, -1);
  }

  private dayAfter(dateString: string): string {
    return this.shiftDate(dateString, 1);
  }

  private shiftDate(dateString: string, days: number): string {
    const date = new Date(dateString + 'T00:00:00');
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
