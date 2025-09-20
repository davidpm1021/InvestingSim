// Core modules
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';

// Services
import { ACCOUNT_TITLE, ACCOUNT_TYPE, TRANSACTION_TYPE } from '@shared/models/common';

// Application component
import { ViewAccountDialogComponent } from './components/view-account-dialog/view-account-dialog.component';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { AccountService } from '@app/core/services/account.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-account-activity',
  templateUrl: './account-activity.component.html',
  styleUrls: ['./account-activity.component.scss'],
})
export class AccountActivityComponent implements OnInit {
  public title: string = 'SAVINGS';
  public dataSource: any[] = [];

  public columns = [
    {
      columnDef: 'id',
      header: 'Id',
      cell: (element: any) => `${element.id}`,
    },
    {
      columnDef: 'date',
      header: 'Date',
      cell: (element: any) => `${element.date}`,
      type: 'date',
      format: 'MM/dd/yyyy'
    },
    {
      columnDef: 'description',
      header: 'Description',
      cell: (element: any) => `${element.description}`,
    },
    {
      columnDef: 'amount',
      header: 'Amount',
      cell: (element: any) => `${element.amount}`,
      type: 'number'
    },
    {
      columnDef: 'balance',
      header: 'Balance',
      cell: (element: any) => `${element.balance}`,
      type: 'number'
    },
    {
      columnDef: 'actions',
      header: 'Actions',
      type: 'info',
      icon: 'delete',
      cell: (element: any) => ''
    }
  ];

  public savingAccountDataSource = [];
  public checkingDataSource = [];
  public selectedAccount = '2';
  public type: string;
  private subscriptions = new Subscription();

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    this.getData();
    this.getTransactions();
    this.clickHandler(this.selectedAccount)
  }

  getData(): void {
    this.subscriptions.add(this.route.queryParams.subscribe((params: any) => {
      this.type = params.type;
      if (this.type === ACCOUNT_TYPE.SAVINGS) {
        this.clickHandler('1')
      } else {
        this.clickHandler('2');
      }
    }));
  }

  getTransactions(): void {
    this.subscriptions.add(this.accountService.getPastSavingsTransactions().subscribe(data => {
       this.savingAccountDataSource = data;
    }));

    this.subscriptions.add(this.accountService.getPastCheckingTransactions().subscribe(data => {
      this.checkingDataSource = data;
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  clickHandler(event: any): void {
    this.selectedAccount = event;
    if (event === '1') {
      this.title = ACCOUNT_TITLE.SAVINGS;
      this.dataSource = this.savingAccountDataSource;
    } else {
      this.title = ACCOUNT_TITLE.CHECKINGS;
      this.dataSource = this.checkingDataSource;
    }
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(ViewAccountDialogComponent, {
      width: '500px',
      data: {title: this.title}
    });

    dialogRef.afterClosed().subscribe(result => {
    })
  }

  onDeleteClick(event: any): void {
    this.dataSource = this.accountService.filterCurrentDataSource(this.dataSource, event);
    this.accountService.deleteSavingAccountTransaction(event);
    this.accountService.deleteCheckingAccountTransaction(event);
    this.clickHandler(this.selectedAccount);
  }

  deleteBill(event: any): void {
    this.dataSource = this.accountService.filterCurrentDataSource(this.dataSource, event);
    this.accountService.deleteBill(event);
    this.clickHandler(this.selectedAccount);
  }

  openDeleteDialog(event: any) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '25%',
      height: '190px'
     });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (event.type && event.type !== TRANSACTION_TYPE.BILL) {
          this.onDeleteClick(event);
        } else {
          this.deleteBill(event);
        }
      }
    });
  }
}
