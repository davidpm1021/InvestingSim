// Core modules
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ACCOUNT_TYPE, MESSAGES } from '@shared/models/common';

// Angular forms
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';

// Services
import { FilterService } from '@core/services/filter.service';
import { NotificationsService } from '@core/services/notifications.service';
import { AccountService } from '@app/core/services/account.service';
import { Subscription } from 'rxjs';
import * as moment from 'moment';

@Component({
  selector: 'app-make-transfer',
  templateUrl: './make-transfer.component.html',
  styleUrls: ['./make-transfer.component.scss'],
})
export class MakeTransferComponent implements OnInit {
  public transferForm = new FormGroup({});
  public savingBalance: any;
  public checkingBalance: any;
  public currentSelectedDate: any;
  public minDate: any;
  private subscriptions = new Subscription();
  public maxDate: any;
  public paymentDate: any;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private notificationService: NotificationsService,
    private filterService: FilterService,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.minDate = this.filterService.selectedDate;
    this.paymentDate = this.minDate;
    this.maxDate = moment(this.minDate).add(1, "years");
    this.transferForm = this.fb.group({
      fromAccount: new FormControl('', [Validators.required]),
      toAccount: new FormControl('', [Validators.required]),
      amount: new FormControl('', [Validators.required]),
      frequency: new FormControl('', [Validators.required]),
      date: new FormControl(new Date(this.filterService.selectedDate), [Validators.required])
    });
    this.getData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get fromAccount(): AbstractControl | null {
    return this.transferForm.get('fromAccount');
  }
  get toAccount(): AbstractControl | null {
    return this.transferForm.get('toAccount');
  }
  get amount(): AbstractControl | null {
    return this.transferForm.get('amount');
  }
  get frequency(): AbstractControl | null {
    return this.transferForm.get('frequency');
  }

  getData(): void {
    this.subscriptions.add(this.accountService.getSavingsBalance().subscribe((data: any) => {
      this.savingBalance = data;
    }));
    this.subscriptions.add(this.accountService.getCheckingsBalance().subscribe((data: any) => {
      this.checkingBalance = data;
    }));
  }

  submit(): void {
    let balance = this.checkingBalance;
    if (this.fromAccount?.value === ACCOUNT_TYPE.SAVINGS) {
      balance = this.savingBalance;
    } 
    if (this.filterService.selectedDate === this.transferForm.value.date.toISOString() && this.amount?.value > balance) {
      alert(MESSAGES.MAKE_TRANSFER);
      return;
    }
    this.transferToCheckingAccount();
    this.transferToSavingAccount();
    this.accountService.updateAccounts();
    this.router.navigate(['/transfer/display-transfers']);
  }

  transferToCheckingAccount(): void {
    if (this.toAccount?.value === ACCOUNT_TYPE.CHECKING) {
      const frequency = this.transferForm.get('frequency')?.value;
      if (frequency && frequency === 'SINGLE') {
        this.accountService.makeSingleTransfer(this.transferForm.value);
      } else {
       this.accountService.makeRecurringTransfer(this.transferForm.value);
      }
      this.notificationService.showSuccess(MESSAGES.CHECKING_ACCOUNT, '');
    }
  }

  transferToSavingAccount(): void {
    if (this.toAccount?.value === ACCOUNT_TYPE.SAVINGS) {
      const frequency = this.transferForm.get('frequency')?.value;
      if (frequency && frequency === 'SINGLE') {
        this.accountService.makeSingleTransfer(this.transferForm.value);
      } else {
       this.accountService.makeRecurringTransfer(this.transferForm.value);
      }
      this.notificationService.showSuccess(MESSAGES.SAVING_ACCOUNT, '');
    }
  }

  selectDate(): void {
    let date = this.transferForm.get('date')?.value;
    if (moment(date).isBefore(this.minDate)) {
      alert(`You can not set date before ${this.minDate}`);
      this.transferForm.get('date')?.patchValue(this.paymentDate);
    } else if (moment(date).isAfter(this.maxDate)) {
      alert(`You can not set date after ${this.maxDate}`);
      this.transferForm.get('date')?.patchValue(this.paymentDate);
    }
    this.paymentDate = this.transferForm.get('date')?.value;
  }
}
