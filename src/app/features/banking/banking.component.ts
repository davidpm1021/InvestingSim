import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EvergreenDatePipe } from '../../shared/pipes/evergreen-date.pipe';
import { DefineComponent } from '../../shared/components/define/define.component';
import { PageIntroComponent } from '../../shared/components/page-intro/page-intro.component';
import { Subscription } from 'rxjs';
import { TransactionsService, Transaction } from '../../shared/services/transactions.service';
import { CurrentDateService } from '../../shared/services/current-date.service';

@Component({
  selector: 'app-banking',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, EvergreenDatePipe, DefineComponent, PageIntroComponent],
  templateUrl: './banking.component.html',
  styleUrl: './banking.component.scss'
})
export class BankingComponent implements OnInit, OnDestroy {
  cashBalance: number = 0;
  currentDate: string = '2025-01-01';
  transactions: Array<Transaction & { runningBalance: number, displayDescription: string }> = [];
  private subscription = new Subscription();

  constructor(
    public transactionsService: TransactionsService,
    public currentDateService: CurrentDateService
  ) {}

  ngOnInit(): void {
    // Subscribe to current date
    this.subscription.add(
      this.currentDateService.currentDate$.subscribe(date => {
        this.currentDate = date;
      })
    );

    // Subscribe to account balance
    this.subscription.add(
      this.transactionsService.getCurrentBalance$('banking001').subscribe(balance => {
        this.cashBalance = balance;
      })
    );

    // Subscribe to transactions with running balances
    this.subscription.add(
      this.transactionsService.getTransactionsWithRunningBalance$('banking001').subscribe(transactions => {
        this.transactions = transactions;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getTransactionAmount(transaction: Transaction & { runningBalance: number, displayDescription: string }): number {
    if (transaction.type === 'transfer') {
      // For transfers, show the amount from the banking account's perspective
      if (transaction.account_from === 'banking001') {
        return -transaction.amount; // Money going out
      } else if (transaction.account_to === 'banking001') {
        return transaction.amount; // Money coming in
      }
    }
    return transaction.amount;
  }
}
