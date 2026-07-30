import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TransactionsService } from '../../services/transactions.service';
import { HoldingsService } from '../../services/holdings.service';
import { DataService } from '../../services/data.service';
import { CurrentDateService } from '../../services/current-date.service';

/**
 * Year-End Review capstone — a headline summary of the full year, shown when the
 * student reaches the Year-End Review. Reuses the same service primitives as the
 * statement (ledger, holdings value, allocation weights). No worksheet handoff.
 */
@Component({
  selector: 'app-capstone-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './capstone-dialog.component.html',
  styleUrl: './capstone-dialog.component.scss'
})
export class CapstoneDialogComponent implements OnInit {
  model: any = null;

  constructor(
    public dialogRef: MatDialogRef<CapstoneDialogComponent>,
    private transactionsService: TransactionsService,
    private holdingsService: HoldingsService,
    private dataService: DataService,
    private currentDateService: CurrentDateService
  ) {}

  ngOnInit(): void {
    const asOf = this.currentDateService.getCurrentDate();
    const cash = this.transactionsService.getBalanceAtDate('brokerage001', asOf);
    const investments = this.holdingsService.getInvestmentsValueAtDate(asOf);
    const finalValue = cash + investments;

    const ledger = this.transactionsService.getLedgerAsOf(asOf).filter(t => t.account === 'brokerage001');
    const deposits = ledger.filter(t => t.type === 'transaction' && t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const withdrawn = ledger.filter(t => t.type === 'transaction' && t.amount < 0).reduce((s, t) => s - t.amount, 0);
    const dividends = ledger.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const interest = ledger.filter(t => t.type === 'interest').reduce((s, t) => s + t.amount, 0);

    // Gain = what you still hold PLUS anything withdrawn back to Savings, minus what you
    // deposited (value earned over your net contributions). Return % is that gain over
    // net contributions (deposits - withdrawals), matching the Overview. Null (shown as a
    // dash) when net contributions are <= 0 — you have withdrawn at least as much as you
    // put in, so a percentage is undefined.
    const netContributions = deposits - withdrawn;
    const gainLoss = finalValue + withdrawn - deposits;
    const gainLossPct = netContributions > 0 ? (gainLoss / netContributions) * 100 : null;

    const { stocks, bonds } = this.dataService.getAssetClassTotals(
      this.holdingsService.getHoldingDetailsAtDate(asOf)
    );
    const total = finalValue || 1;

    this.model = {
      finalValue,
      added: deposits,
      withdrawn,
      gainLoss,
      gainLossPct,
      incomeTotal: dividends + interest,
      allocation: [
        { label: 'Stocks', pct: (stocks / total) * 100 },
        { label: 'Bonds', pct: (bonds / total) * 100 },
        { label: 'Cash', pct: (cash / total) * 100 }
      ]
    };
  }

  close(): void {
    this.dialogRef.close();
  }
}
