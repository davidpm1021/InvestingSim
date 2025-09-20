// Core modules
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

// Application components
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { ViewAccountDialogComponent } from '../account-activity/components/view-account-dialog/view-account-dialog.component';
import { AccountService } from '@app/core/services/account.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {
  public title: string = 'SAVINGS';
  public dataSource: any[] = [];

  public columns: any[] = [];
  public type: string;
  private subscriptions = new Subscription();

  constructor(
    private dialog: MatDialog,
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    this.initializeColumns();
    this.getTransactions();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  getTransactions(): void {
    this.subscriptions.add(this.accountService.getNotifications().subscribe((data: any) => {
      this.dataSource = [...data[0], ...data[1]];
   }));
  }

  initializeColumns(): void {
    this.columns = [{
      columnDef: 'date',
      header: 'Date',
      cell: (element: any) => `${element.date}`,
      type: 'date',
      format: 'MM/dd/yyyy'
    },
    {
      columnDef: 'notificationText',
      type:'html',
      header: 'Description',
      cell: (element: any) => `${element.notificationText}`,
    }];
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
  }

  deleteBill(event: any): void {
    this.dataSource = this.accountService.filterCurrentDataSource(this.dataSource, event);
    this.accountService.deleteBill(event);
  }

  openDeleteDialog(event: any) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '25%',
      height: '190px'
     });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (event.type) {
          this.onDeleteClick(event);
        } else {
          this.deleteBill(event);
        }
      }
    });
  }

}
