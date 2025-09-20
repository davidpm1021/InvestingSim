// Core modules
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SESSION_STORAGE } from '@shared/models/common';

// Angular forms
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

// Services
import { FilterService } from '@core/services/filter.service';
import * as moment from 'moment';
import { AccountService } from "@core/services/account.service";
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  public isUserLoggedIn = false;
  public headerForm: FormGroup;
  public todayDate = new Date();
  public maxDate: any;
  public notificationCount = 0;
  private subscriptions = new Subscription();
  private localStorageKeys = [
    'SAVING_ACCOUNT',
    'CHECKING_ACCOUNT',
    'USER', 
    'RECIPIENT',
    'BILLS' ,
    'SELECTED_DATE' ,
    'ACCOUNT_OPENING_DATE' , 
    'INVALID_TRANSACTIONS' ,
    'NOTIFICATIONS' , 
    'FIRST_LOGIN' 
  ]
  isTestMode: boolean;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private filterService: FilterService,
    public accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.isUserLoggedIn = localStorage.getItem(SESSION_STORAGE.USER) ? true : false;

    // Check if test date exist. If yes, set it as today's date
    const testDate = localStorage.getItem(SESSION_STORAGE.TEST_DATE);
    if (testDate) {
      this.todayDate = new Date(JSON.parse(testDate));
    } else {
      const date = moment().startOf('day');
      this.todayDate = new Date(date.toDate());
    }
    this.maxDate = moment();
    this.maxDate = this.maxDate.add(1, "years");
    this.maxDate = this.maxDate.toDate();
    this.headerForm = this.fb.group({
      startDate: new FormControl(this.todayDate),
      date: new FormControl(this.todayDate)
    });
    const filterSelectedDate = localStorage.getItem(SESSION_STORAGE.SELECTED_DATE);
    if (filterSelectedDate) {
      this.filterService.selectedDate = JSON.parse(filterSelectedDate);
      this.headerForm.get('date')?.patchValue(new Date(this.filterService.selectedDate));
      this.filterService.setDate.next(this.filterService.selectedDate);
    } else {
      this.filterService.selectedDate = this.headerForm.get('date')?.value;
      localStorage.setItem(SESSION_STORAGE.SELECTED_DATE, JSON.stringify(this.filterService.selectedDate));
    }
    if (!this.filterService.accountOpeningDate) {
      const date = localStorage.getItem(SESSION_STORAGE.ACCOUNT_OPENING_DATE);
      if (date) {
        this.filterService.accountOpeningDate = JSON.parse(date);
      }
    }
    this.getNotifications();
    this.accountService.updateAccounts();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  logout(): void {
    this.clearLocalStorage();
    this.isUserLoggedIn = false;
    this.headerForm.get('data')?.setValue(new Date());
    this.filterService.selectedDate = '';
    this.filterService.accountOpeningDate = null;
    this.router.navigate(['home']);
  }

  clearLocalStorage(): void {
    this.localStorageKeys.forEach((key: string) => {
      if (localStorage.getItem(key) !== SESSION_STORAGE.TEST_DATE) {
      const localStorageKey = (<any>SESSION_STORAGE)[key]
      localStorage.removeItem(localStorageKey);
      }
    })
  }

  selectDate(): void {
    let date = this.headerForm.get('date')?.value;
    if (moment(date).isBefore(this.todayDate)) {
      alert(`You can not set date before ${this.todayDate}`);
      this.headerForm.get('date')?.patchValue(this.filterService.selectedDate);
      date = this.filterService.selectedDate;
    } else if (moment(date).isAfter(this.maxDate)) {
      alert(`You can not set date after ${this.maxDate}`);
      this.headerForm.get('date')?.patchValue(this.filterService.selectedDate);
      date = this.filterService.selectedDate;
    }
    if (this.filterService.accountOpeningDate && this.filterService.accountOpeningDate > date) {
      date = this.filterService.accountOpeningDate;
    }
    this.filterService.setDate.next(date);
    this.filterService.selectedDate = date;
    this.accountService.updateAccounts();
    localStorage.setItem(SESSION_STORAGE.SELECTED_DATE, JSON.stringify(this.filterService.selectedDate));
    this.router.navigate(['/home']).then(() => {
      this.router.navigate(['/']);
    });
  }

  getNotifications(): void {
    this.subscriptions.add(this.accountService.getNotifications().subscribe((data: any) => {
      this.notificationCount = data[0]?.length + data[1]?.length;
   }));
  }

  testMode(): void {
    this.isTestMode = true;
  }

  selectStartDate(): void {
    let date = this.headerForm.get('startDate')?.value;
    localStorage.setItem(SESSION_STORAGE.TEST_DATE, JSON.stringify(date));
  }
}
