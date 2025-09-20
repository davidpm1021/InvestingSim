// Core modules
import { Component, OnInit } from '@angular/core';

// Angular forms
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { GROUP_IDS, IDS, MESSAGES, SESSION_STORAGE, TRANSACTION_TYPE, TRANSFER_IDS } from '@shared/models/common';

// Services
import { CommonService } from '@core/services/common.service';
import { FilterService } from '@core/services/filter.service';
import { NotificationsService } from '@core/services/notifications.service';

// Application component
import { AddRecipientDialogComponent, IRecipient } from './components/add-recipient-dialog/add-recipient-dialog.component';
import * as moment from 'moment';
import { AccountService } from '@app/core/services/account.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pay-bill',
  templateUrl: './pay-bill.component.html',
  styleUrls: ['./pay-bill.component.scss'],
})
export class PayBillComponent implements OnInit {
  public recipientList: IRecipient[] = [];
  public payBillForm: FormGroup;
  public savingBalance: number;
  public checkingBalance: number;
  public minDate: any;
  public buttonHide = true;
  private subscriptions = new Subscription();
  public paymentDate: any;
  public maxDate: any;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private notificationService: NotificationsService,
    private filterService: FilterService,
    private commonService: CommonService,
    private dialog: MatDialog,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.minDate = this.filterService.selectedDate;
    this.minDate = moment(this.minDate);
    const afterFiveDays = this.minDate.add(5, 'days')
    this.minDate = afterFiveDays.toDate();
    this.paymentDate = this.minDate;
    this.maxDate = moment(this.minDate).add(1, "years");

    this.payBillForm = this.fb.group({
      id: new FormControl(IDS.PAY_BILL),
      frequency: new FormControl(null, [Validators.required]),
      recipient: new FormControl(null, [Validators.required]),
      date: new FormControl(this.minDate, [
        Validators.required,
      ]),
      amount: new FormControl(0, [Validators.required]),
      description: new FormControl(''),
      account: new FormControl('checking'),
    });
    this.getRecipientList();
    this.getData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  getRecipientList(): void {
    const recipientList = localStorage.getItem(SESSION_STORAGE.RECIPIENT);
    if (recipientList) {
      const details = JSON.parse(recipientList);
      this.recipientList = details;
    }
  }


  submit(): void {
    const frequency = this.payBillForm.get('frequency')?.value;
    if (frequency && frequency === 'SINGLE') {
      this.accountService.addSingleBillToTransaction(SESSION_STORAGE.BILLS, this.payBillForm.value);
    } else {
      this.accountService.addRecurringBillTransaction(SESSION_STORAGE.BILLS, this.payBillForm.value)
    }

    this.notificationService.showSuccess(MESSAGES.PAY_BILLS, '');
    this.router.navigate(['pay-bill/display-bills']);
  }

  getData(): void {
    this.subscriptions.add(this.accountService.getSavingsBalance().subscribe((data: any) => {
      this.savingBalance = data;
    }));
    this.subscriptions.add(this.accountService.getCheckingsBalance().subscribe((data: any) => {
      this.checkingBalance = data;
    }));
  }

  onSelectRecipient(): void {
    const recipientValue = this.payBillForm.get('recipient')?.value;
    this.payBillForm.get('description')?.patchValue(`Payment to: ${recipientValue}`);
  }

  addRecipient() {
    const dialogRef = this.dialog.open(AddRecipientDialogComponent, {
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe((res) => {
      this.getRecipientList();
      this.payBillForm.get('recipient')?.patchValue(res);
    });
  }

  selectDate(): void {
    let date = this.payBillForm.get('date')?.value;
    if (moment(date).isBefore(this.minDate)) {
      alert(`You can not set date before ${this.minDate}`);
      this.payBillForm.get('date')?.patchValue(this.paymentDate);
    } else if (moment(date).isAfter(this.maxDate)) {
      alert(`You can not set date after ${this.maxDate}`);
      this.payBillForm.get('date')?.patchValue(this.paymentDate);
    }
    this.paymentDate = this.payBillForm.get('date')?.value;
  }

}
