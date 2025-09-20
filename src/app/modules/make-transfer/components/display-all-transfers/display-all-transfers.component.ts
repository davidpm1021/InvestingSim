// Core modules
import { Component, OnInit } from '@angular/core';

// Services
import { ConfirmationDialogComponent } from '@app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AccountService } from '@app/core/services/account.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-display-all-transfers',
  templateUrl: './display-all-transfers.component.html',
  styleUrls: ['./display-all-transfers.component.scss']
})
export class DisplayAllTransfersComponent implements OnInit {
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
      columnDef: 'actions',
      header: 'Actions',
      type: 'info',
      icon: 'delete',
      cell: (element: any) => ''
    }
  ];
  public dataSource: any[] = [];
  public upcomingDataSource: any[] = [];
  private accountType = '2';
  private subscriptions = new Subscription();
  private savingUpcoming: any[] = [];
  private checkingUpcoming: any[] = [];
  private savingPast: any[] = [];
  private checkingPast: any[] = [];


  constructor(
    public dialog: MatDialog,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.getTransactions();
    this.clickHandler(this.accountType);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  getTransactions(): void {
    this.subscriptions.add(this.accountService.getUpcomingSavingsTransfers().subscribe(data => {
      this.savingUpcoming = this.accountService.filterFirstRecordForRecurring(data);
    }));

    this.subscriptions.add(this.accountService.getPastSavingTransfers().subscribe(data => {
      this.savingPast = data;
    }));

    this.subscriptions.add(this.accountService.getUpcomingCheckingTransfers().subscribe(data => {
      this.checkingUpcoming = this.accountService.filterFirstRecordForRecurring(data);
    }));

    this.subscriptions.add(this.accountService.getPastCheckingTransfers().subscribe(data => {
      this.checkingPast = data;
    }));
  }

  clickHandler(event: any): void {
    this.accountType = event.value;
    if (event === '1') {
      this.dataSource = this.savingPast;
      this.upcomingDataSource = this.savingUpcoming;
    } else {
      this.dataSource = this.checkingPast;
      this.upcomingDataSource = this.checkingUpcoming;
    }
  }

  onDeleteClick(event: any): void {
    this.dataSource = this.accountService.filterCurrentDataSource(this.dataSource, event);
    this.accountService.deleteSavingAccountTransaction(event);
    this.accountService.deleteCheckingAccountTransaction(event);
    this.clickHandler(this.accountType);
  }

  onUpcomingDeleteClick(event: any): void {
    this.upcomingDataSource = this.accountService.filterCurrentDataSource(this.upcomingDataSource, event);
    this.accountService.deleteSavingAccountTransaction(event);
    this.accountService.deleteCheckingAccountTransaction(event);
    this.clickHandler(this.accountType);
  }

  openDeleteDialog(event: any, isUpcoming = false) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '25%',
      height: '190px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (isUpcoming) {
          this.onUpcomingDeleteClick(event);
        } else {
          this.onDeleteClick(event)
        }
      }
    });
  }
}
