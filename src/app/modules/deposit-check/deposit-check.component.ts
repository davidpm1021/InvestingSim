// Core modules
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ACCOUNT_TYPE, DESCRIPTIONS, IDS, MESSAGES, SESSION_STORAGE, TRANSACTION_TYPE } from '@shared/models/common';
import { Router } from '@angular/router';

// Angular forms
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

// Application component
import { UploadCheckDialogComponent } from './components/upload-check-dialog/upload-check-dialog.component';

// Services
import { NotificationsService } from '@core/services/notifications.service';
import { FilterService } from '@core/services/filter.service';
import { AccountService } from '@app/core/services/account.service';
import { Subscription } from 'rxjs';

export interface DialogData {
  check: string;
}
@Component({
  selector: 'app-deposit-check',
  templateUrl: './deposit-check.component.html',
  styleUrls: ['./deposit-check.component.scss'],
})
export class DepositCheckComponent implements OnInit {

  public depositForm: FormGroup;
  public savingBalance: number;
  public checkingBalance: number;
  private subscriptions = new Subscription();
  

  constructor(
    public dialog: MatDialog,
    private fb: FormBuilder,
    private router: Router,
    private notificationService: NotificationsService,
    private filterService: FilterService,
    private accountService: AccountService
    ) {}

  ngOnInit(): void {
    this.depositForm = this.fb.group({
      id: new FormControl(IDS.DEPOSIST_CHECK),
      fromAccount: new FormControl('', [Validators.required]),
      amount: new FormControl('', [Validators.required])
    });
    this.getData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get fromAccount(): AbstractControl | null {
    return this.depositForm.get('fromAccount');
  }

  get amount(): AbstractControl | null {
    return this.depositForm.get('amount');
  }

  openDialog(check: string): void {
    const dialogRef = this.dialog.open(UploadCheckDialogComponent, {
      data: {check: check},
    });

    dialogRef.afterClosed().subscribe(() => {});
  }

  getData(): void {
    this.subscriptions.add(this.accountService.getSavingsBalance().subscribe((data: any) => {
      this.savingBalance = data;
    }));
    this.subscriptions.add(this.accountService.getCheckingsBalance().subscribe((data: any) => {
      this.checkingBalance = data;
    }));
  }

  depositCheck(): void {
    if (this.fromAccount?.value === ACCOUNT_TYPE.CHECKING) {
      const transaction = {
        type: TRANSACTION_TYPE.DEPOSIT,
        amount: this.amount?.value,
        date: this.filterService.selectedDate,
        description: DESCRIPTIONS.DEPOSIT_CHECK_CHECKING
      }
      this.accountService.insertTransaction(SESSION_STORAGE.CHECKING_ACCOUNT, transaction);
    } else {
      const transaction = {
        type: TRANSACTION_TYPE.DEPOSIT,
        amount: this.amount?.value,
        date: this.filterService.selectedDate,
        description: DESCRIPTIONS.DEPOSIT_CHECK_SAVING
      }
      this.accountService.insertTransaction(SESSION_STORAGE.SAVING_ACCOUNT, transaction);
    }
    this.notificationService.showSuccess(MESSAGES.DEPSOIT_CHECK, '');
    this.router.navigate(['account']);
  }
}
