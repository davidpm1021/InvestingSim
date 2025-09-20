// Core modules
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

// Material modules
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MESSAGES, SESSION_STORAGE } from '@shared/models/common';

// Services
import { NotificationsService } from '@core/services/notifications.service';

// Application Component
import { AddRecipientDialogComponent, IRecipient } from './../add-recipient-dialog/add-recipient-dialog.component';

@Component({
  selector: 'app-manage-recipient',
  templateUrl: './manage-recipient.component.html',
  styleUrls: ['./manage-recipient.component.scss'],
})
export class ManageRecipientComponent implements OnInit {
  public displayedColumns = ['name', 'edit', 'delete'];
  public dataSource: IRecipient[] = [];

  @ViewChild(MatPaginator, { static: true })
  paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true })
  sort!: MatSort;

  tableDataSource = new MatTableDataSource<any>();

  constructor(
    public dialog: MatDialog,
    private notificationService: NotificationsService
    ) {}

  ngOnInit(): void {
    this.getData();
  }

  openRecipientDialog(data?: any) {
    const dialogRef = this.dialog.open(AddRecipientDialogComponent, {
      width: '50%',
      data
    });

    dialogRef.afterClosed().subscribe(() => {
      this.getData();
    });
  }

  getData(): void {
    const recipientList = localStorage.getItem(SESSION_STORAGE.RECIPIENT);
    if (recipientList) {
     const details = JSON.parse(recipientList);
     this.dataSource = details;
     this.updateData();
    }
  }

  edit(data: IRecipient): void {
    this.openRecipientDialog(data)
  }

  delete(data: IRecipient): void {
    this.dataSource = this.dataSource.filter(item => item.id !== data.id);
    localStorage.setItem(SESSION_STORAGE.RECIPIENT, JSON.stringify(this.dataSource));
    this.notificationService.showSuccess(MESSAGES.RECIPIENT_DELETE, '');
    this.updateData();
  }

  updateData(): void {
    this.tableDataSource = new MatTableDataSource(this.dataSource);
    this.tableDataSource.paginator = this.paginator;
    this.tableDataSource.sort = this.sort;
  }
}
