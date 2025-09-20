import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from '@core/services/common.service';
import { NotificationsService } from '@core/services/notifications.service';
import { MESSAGES, SESSION_STORAGE } from '@shared/models/common';
import { TransactionService } from '@core/services/transaction.service';
import { Subscription } from 'rxjs';
import { AccountService } from '@app/core/services/account.service';

@Component({
  selector: 'app-money-quiz',
  templateUrl: './money-quiz.component.html',
  styleUrls: ['./money-quiz.component.scss'],
})
export class MoneyQuizComponent implements OnInit {
  public categories: any[] = [];
  public formGroup: FormGroup;
  private subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private commonService: CommonService,
    private router: Router,
    private notificationService: NotificationsService,
    private transactionService: TransactionService,
    private accountService: AccountService
    ) {}

  ngOnInit(): void {
    this.subscription = this.commonService.getShoppingListFromFile().subscribe(data => {
      this.categories = data.list;
      this.initializeForm();
    })
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  initializeForm() {
    this.formGroup = this.fb.group({});
    this.categories.forEach((category) => {
      category.values.forEach((value: any) => {
        this.formGroup.addControl(`${value.id}`, new FormControl());
        this.formGroup.addControl(`${value.id}_title`, new FormControl(value.title));
        this.formGroup.addControl(`${value.id}_amount`, new FormControl(value.amount));
      });
    });
  }

  save(): void {
    let selectedTransaction: any[] = [];
    Object.keys(this.formGroup.value).map((key: string) => {
      if (this.formGroup.value[key] ===  true) {
        const title  = `${key}_title`;
        const amount  = `${key}_amount`;
        const obj = {
          id: key,
          title: this.formGroup.value[title],
          amount: this.formGroup.value[amount]
        }
        selectedTransaction.push(obj);
      }
    });
    this.transactionService.addShoppingTransactionToList(selectedTransaction);
    this.accountService.updateAccounts();
    this.notificationService.showSuccess(MESSAGES.SHOPPING, '');
    this.router.navigate(['account']);
  }
}
