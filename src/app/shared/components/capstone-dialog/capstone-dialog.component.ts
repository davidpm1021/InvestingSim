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
    const added = ledger.filter(t => t.type === 'transaction').reduce((s, t) => s + t.amount, 0);
    const dividends = ledger.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const interest = ledger.filter(t => t.type === 'interest').reduce((s, t) => s + t.amount, 0);

    const gainLoss = finalValue - added;
    const gainLossPct = added > 0 ? (gainLoss / added) * 100 : 0;

    const { stocks, bonds } = this.dataService.getAssetClassTotals(
      this.holdingsService.getHoldingDetailsAtDate(asOf)
    );
    const total = finalValue || 1;

    this.model = {
      finalValue,
      added,
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
