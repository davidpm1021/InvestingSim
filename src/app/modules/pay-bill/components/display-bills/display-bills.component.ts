// Core modules
import {Component, OnInit} from '@angular/core';

// Services
import { MatDialog} from '@angular/material/dialog';
import { ConfirmationDialogComponent} from '@app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { AccountService } from '@app/core/services/account.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-display-bills',
  templateUrl: './display-bills.component.html',
  styleUrls: ['./display-bills.component.scss'],
})
export class DisplayBillsComponent implements OnInit {
  public columns = [
    {
      columnDef: 'id',
      header: 'ID',
      cell: (element: any) => `${element.id}`,
    },
    {
      columnDef: 'date',
      header: 'Date',
      cell: (element: any) => `${element.date}`,
      type: 'date'
    },
    {
      columnDef: 'amount',
      header: 'Amount',
      cell: (element: any) => `${element.amount}`,
      type: 'number'
    },
    {
      columnDef: 'recipient',
      header: 'Recipient',
      cell: (element: any) => element.recipient ?`Payment to: ${element.recipient}`: `${element.description}`,
    },
    {
      columnDef: 'frequency',
      header: 'Frequency',
      cell: (element: any) => `${element.frequency}`,
    },
    {
      columnDef: 'actions',
      header: 'Actions',
      type: 'info',
      icon: 'delete',
      cell: (element: any) => ''
    },
  ];
  public dataSource: any[] = [];
  public upcomingDataSource: any[] = [];
  private subscriptions = new Subscription();

  constructor(
    private dialog: MatDialog,
    private accountService: AccountService
  ) {
  }

  ngOnInit(): void {
    this.getData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  getData(): void {
    this.subscriptions.add(this.accountService.getPastBillsTransactions().subscribe(data => {
      this.dataSource = data;
    }));

    this.subscriptions.add(this.accountService.getUpcomingBillsTransactions().subscribe(data => {
     this.upcomingDataSource = this.accountService.filterFirstRecordForRecurring(data);
    }));
  }

  onDeleteClick(event: any): void {
    this.dataSource = this.accountService.filterCurrentDataSource(this.dataSource, event);
    if (event.description === 'Streamwave Videos') {
      this.accountService.deleteCheckingAccountTransaction(event);
    } else {
      this.accountService.deleteBill(event);
    }
  }

  onDeleteUpcomingClick(event: any): void {
    this.upcomingDataSource = this.accountService.filterCurrentDataSource(this.upcomingDataSource, event);
    if (event.description === 'Streamwave Videos') {
      this.accountService.deleteCheckingAccountTransaction(event);
    } else {
      this.accountService.deleteBill(event);
    }
  }

  openDeleteDialog(event: any, isUpcoming = false) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '25%',
      height: '190px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (isUpcoming) {
          this.onDeleteUpcomingClick(event);
        } else {
          this.onDeleteClick(event)
        }
      }
    });
  }
}
