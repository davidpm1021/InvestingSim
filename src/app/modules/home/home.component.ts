import { CommonService } from '@core/services/common.service';
// Core modules
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GROUP_IDS, IDS, NOTIFICATIONS, SESSION_STORAGE, TRANSFER_IDS } from '@shared/models/common';

// Services
import { Subscription } from 'rxjs';
import { TransactionService } from '@core/services/transaction.service';
import { AccountService } from '@app/core/services/account.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  public initialCheckingTransactions: any;
  public initialSavingTransactions: any;
  private subscription = new Subscription();
  constructor(
    private router: Router,
    private commonService: CommonService,
    private transactionService: TransactionService,
    private accountService: AccountService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  startNow(): void {
    // @ts-ignore
    console.log('gtag', window.gtag);
    // @ts-ignore
    if (window && window.gtag) {
      // @ts-ignore
      window.gtag('event', 'level_start', {
        'event_category': 'NGPF Bank Simulator',
        'app_name': 'Bank Simulator',
        'event_label': 'start_now',
        'value': 1
      });
    }

    if (this.isSessionAvailable()) {
      localStorage.clear();
    }
    this.subscription = this.commonService.getInitialTransaction().subscribe(data => {
      this.initialCheckingTransactions = data.checkingTransactions;
      this.initialSavingTransactions = data.savingTransactions;
      this.addUser();

      // Add initial transactions
      this.transactionService.addInitialTransactionToList(SESSION_STORAGE.CHECKING_ACCOUNT, this.initialCheckingTransactions, TRANSFER_IDS.CHECKING_ACCOUNT, GROUP_IDS.CHECKING_ACCOUNT, IDS.CHECKING_ACCOUNT);
      this.transactionService.addInitialTransactionToList(SESSION_STORAGE.SAVING_ACCOUNT, this.initialSavingTransactions, TRANSFER_IDS.SAVING_ACCOUNT, GROUP_IDS.SAVING_ACCOUNT, IDS.SAVING_ACCOUNT);
      this.accountService.updateAccounts();
      localStorage.setItem(SESSION_STORAGE.FIRST_LOGIN, 'true');
      this.router.navigate(['']);
    })
  }

  isSessionAvailable(): any {
    return localStorage.getItem(SESSION_STORAGE.USER);
  }

  addUser(): void {
    const user = {
      userName: 'johanna457',
      password: '12345678',
      fullName: 'Johanna Peralta',
      address: '577 Stroman Trace',
      city: 'Rolfsonland',
      state: 'Utah',
      zipCode: '87700',
      question1: '3',
      question2: '1',
      answer1: 'Mathura',
      answer2: 'Anynomous',
      lowerLimit: NOTIFICATIONS.LOWER_LIMIT,
      uppperLimit: NOTIFICATIONS.UPPER_LIMIT
    }
    localStorage.setItem(SESSION_STORAGE.USER, JSON.stringify(user));
  }

  continue(): void {
    let returnUrl = this.route.snapshot.queryParamMap.get('returnUrl')
    if (!returnUrl) {
      returnUrl = '/';
    }
    this.router.navigate([returnUrl]);
  }
}
