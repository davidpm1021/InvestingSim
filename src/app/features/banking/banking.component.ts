import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DataService, Transaction } from '../../shared/services/data.service';
import { TransferDialogComponent } from './transfer-dialog.component';

@Component({
  selector: 'app-banking',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: './banking.component.html',
  styleUrl: './banking.component.scss'
})
export class BankingComponent implements OnInit, OnDestroy {
  cashBalance: number = 0;
  currentDate: string = '2025-01-01';
  transactions: Array<Transaction & { runningBalance: number, displayDescription: string }> = [];
  private subscription = new Subscription();

  constructor(public dataService: DataService, private dialog: MatDialog) {}

  ngOnInit(): void {
    // Subscribe to current date
    this.subscription.add(
      this.dataService.currentDate$.subscribe(date => {
        this.currentDate = date;
      })
    );

    // Subscribe to account balance
    this.subscription.add(
      this.dataService.getCurrentBalance$('banking001').subscribe(balance => {
        this.cashBalance = balance;
      })
    );

    // Subscribe to transactions with running balances
    this.subscription.add(
      this.dataService.getTransactionsWithRunningBalance$('banking001').subscribe(transactions => {
        this.transactions = transactions;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  openTransferDialog(): void {
    const dialogRef = this.dialog.open(TransferDialogComponent, {
      width: '400px',
      data: { 
        maxAmount: this.cashBalance,
        currentDate: this.currentDate,
        transferDirection: 'to-brokerage' as const
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.amount > 0) {
        this.dataService.addTransferTransaction(result.amount, this.currentDate);
      }
    });
  }

  getTransactionAmount(transaction: Transaction & { runningBalance: number, displayDescription: string }): number {
    if (transaction.type === 'transfer') {
      // For transfers, show the amount from banking account's perspective
      if (transaction.account_from === 'banking001') {
        return -transaction.amount; // Money going out
      } else if (transaction.account_to === 'banking001') {
        return transaction.amount; // Money coming in
      }
    }
    return transaction.amount;
  }
}
