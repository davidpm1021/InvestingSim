// Core modules
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AccountService } from '@app/core/services/account.service';
import { ACCOUNT_TITLE } from '@app/shared/models/common';

@Component({
  selector: 'app-view-account-dialog',
  templateUrl: './view-account-dialog.component.html',
  styleUrls: ['./view-account-dialog.component.scss']
})
export class ViewAccountDialogComponent implements OnInit {
   
  accountNumbers: number[];
  routingNumbers: number[];
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.accountNumbers = this.accountService.checkingAccountNumners;
    this.routingNumbers = this.accountService.checkingRouteNumbers;
    if (this.data.title === ACCOUNT_TITLE.SAVINGS) {
      this.accountNumbers = this.accountService.savingAccountNumners;
      this.routingNumbers = this.accountService.savingRouteNumbers;
    } 
  }

}
