// Core modules
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AccountService } from '@app/core/services/account.service';
import { WelcomeDialogComponent } from '@shared/components/welcome-dialog/welcome-dialog.component';
import { SESSION_STORAGE } from '@shared/models/common';

// Services
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-home',
  templateUrl: './user-home.component.html',
  styleUrls: ['./user-home.component.scss']
})
export class UserHomeComponent implements OnInit {
  public savingBalance: any;
  public checkingBalance: any;
  public accountType = "1";
  public allBills: { upcoming?: any[]; past?: any[]; };
  public allCheckingTransfers: { upcoming?: any[]; past?: any[]; };
  public allSavingTransfers: { upcoming?: any[]; past?: any[]; };
  private subscriptions = new Subscription();


  constructor(
    private router: Router,
    private accountService: AccountService,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.accountService.updateAccounts();
    this.getData();
    if (localStorage.getItem(SESSION_STORAGE.FIRST_LOGIN)) {
      this.openWelcomeDialog();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  getData(): void {
    this.allBills = {};
    this.allCheckingTransfers = {};
    this.subscriptions.add(this.accountService.getSavingsBalance().subscribe((data: any) => {
      this.savingBalance = data;
    }));
    this.subscriptions.add(this.accountService.getCheckingsBalance().subscribe((data: any) => {
      this.checkingBalance = data;
    }));

    this.subscriptions.add(this.accountService.getUpcomingCheckingTransfers().subscribe((data: any) => {

      //sort data by date ascending
      data.sort((a: any, b: any) => {
        if (a.date == b.date) {
          return a.id - b.id;
        } else {
          return a.date < b.date ? -1 : 1;
        }
      });

      this.allCheckingTransfers.upcoming = data;
    }));

    this.subscriptions.add(this.accountService.getUpcomingBillsTransactions().subscribe(data => {
      data.sort((a: any, b: any) => {
        if (a.date == b.date) {
          return a.id - b.id;
        } else {
          return a.date < b.date ? -1 : 1;
        }
      });
     this.allBills.upcoming = data;

    }));
  }

  navigateToAccount(account: string): void {
    this.router.navigate([`account`], { queryParams: {type: account}});
  }

  openWelcomeDialog(): void {
    const dialogRef = this.dialog.open(WelcomeDialogComponent);

    dialogRef.afterClosed().subscribe(result => {
      localStorage.removeItem(SESSION_STORAGE.FIRST_LOGIN);
    });
  }
}
