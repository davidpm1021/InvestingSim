// Core modules
import {Injectable} from '@angular/core';
import {
  ACCOUNT_TYPE,
  GROUP_IDS,
  IDS,
  SESSION_STORAGE,
  TRANSACTION_TYPE,
  TRANSFER_IDS
} from '@shared/models/common';
import * as moment from 'moment';
import { AccountService } from './account.service';

// Services
import {FilterService} from './filter.service';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
 
  constructor(
    private filterService: FilterService,
    private accountService: AccountService,
  ) {
  }

  getMonthlyTransactions(
    month: string,
    year: string,
    accountType: string
  ): any {
    let account$;
    if (accountType === ACCOUNT_TYPE.SAVINGS) {
      account$ = this.accountService.getSavingsTransactions();
    } else {
      account$ = this.accountService.getCheckingTransactions();
    }
    return account$;
  }

  addShoppingTransactionToList(selectedTransactions: any): void {
    const checkingAccount = localStorage.getItem(SESSION_STORAGE.BILLS);
    if (checkingAccount) {
      const details = JSON.parse(checkingAccount);
      const lastTransaction = details[details.length - 1];
      if (selectedTransactions) {
        selectedTransactions.forEach((transaction: any, index: number) => {
          const record = {
            id: lastTransaction.id + 1 + index,
            description: transaction.title,
            amount: -transaction.amount,
            date: this.filterService.selectedDate,
            transferId: lastTransaction.transferId ? lastTransaction.transferId + 1 : TRANSFER_IDS.SHOPPING,
            type: TRANSACTION_TYPE.BILL,
            doNotDisplayBill: true
          };
          details.push(record);
        });
        localStorage.setItem(SESSION_STORAGE.BILLS, JSON.stringify(details));
      }
    } else {
      const details: any[] = []
      if (selectedTransactions) {
        selectedTransactions.forEach((transaction: any, index: number) => {
          const record = {
            id: IDS.PAY_BILL + index,
            description: transaction.title,
            amount: -transaction.amount,
            date: this.filterService.selectedDate,
            transferId: TRANSFER_IDS.SHOPPING,
            type: TRANSACTION_TYPE.BILL,
            frequency: 'SINGLE',
            doNotDisplayBill: true
          };
          details.push(record);
        });
        localStorage.setItem(SESSION_STORAGE.BILLS, JSON.stringify(details));
      }
    }
  }

  getCurrentDate(): any {
    const testDate = localStorage.getItem(SESSION_STORAGE.TEST_DATE);
    if (testDate) {
      const date = JSON.parse(testDate);
      if (date) {
        return new Date(date);
      }
    } else {
      return new Date();
    }
  }

  addInitialTransactionToList(accountKey: string, transactions: any[], transferId: number, groupId: number, id: number): void {
    transactions.forEach((transaction, index) => {
      if (transaction.frequency === 'SINGLE') {
        const date = this.getCurrentDate();
        const newDate = new Date(date.setDate(date.getDate() + transaction.day))
        const activity = localStorage.getItem(accountKey);
        if (activity) {
          const list = JSON.parse(activity);
          const lastRecord = list[list.length - 1];
          const record = {
            id: lastRecord.id + 1,
            amount: transaction.amount,
            description: transaction.description,
            date: newDate,
            transferId: lastRecord.transferId ? lastRecord.transferId + 1 : transferId,
            groupId: lastRecord.groupId ? lastRecord.groupId + 1 : groupId,
            type: transaction.type
          }
          list.push(record);
          // Update initial transactions in the session storage
          localStorage.setItem(accountKey, JSON.stringify(list));
        } else {
          const record = {
            id: id + index,
            amount: transaction.amount,
            description: transaction.description,
            date: newDate,
            transferId: transferId,
            groupId: groupId,
            // type: 'transfer'
          }
         
          // Set the account opening date before setting the first record in local storage to get the time correct
          const accountOpeningDate = JSON.stringify(newDate);
          // Add first transactions in the session storage
          localStorage.setItem(accountKey, JSON.stringify([record]));

          // Set account opening date
          if (!this.filterService.accountOpeningDate) {
            this.filterService.accountOpeningDate = JSON.parse(accountOpeningDate);
            localStorage.setItem(SESSION_STORAGE.ACCOUNT_OPENING_DATE, accountOpeningDate);
          }
        }
      } else if (transaction.frequency === 'MONTHLY') {
        const date = this.getCurrentDate()
        const newDate = new Date(date.setDate(date.getDate() + transaction.day))
        transaction.date = newDate;
        this.addRecurringTransaction(accountKey, transaction, transferId);
      } else {
        // BI - WEEKLY
        const date = this.getCurrentDate()
        const newDate = new Date(date.setDate(date.getDate() + transaction.day))
        transaction.date = newDate;
        this.addBiWeeklyTransaction(accountKey, transaction, transferId, newDate);
      }
    });
  }

  addRecurringTransaction(accountKey: string, transaction: any, transferId: number): void {
    let accountActivityForMonthly = localStorage.getItem(accountKey);
    let lastTransactionMonthly: any;
    if (accountActivityForMonthly) {
      const details = JSON.parse(accountActivityForMonthly);
      lastTransactionMonthly = details[details.length - 1];
    }
    let newDate:any = moment(transaction.date);

    for (let i=0; i<12; i++) {
      let accountActivity = localStorage.getItem(accountKey);
      if (accountActivity) {
        const details = JSON.parse(accountActivity);
        const lastTransaction = details[details.length - 1];
        const record = {
          id: lastTransaction.id + 1,
          date: newDate,
          amount: transaction.amount,
          description: transaction.description,
          frequency: 'MONTHLY',
          type: transaction.type,
          groupId: lastTransactionMonthly?.groupId ? lastTransactionMonthly.groupId + 1 : GROUP_IDS.SAVING_ACCOUNT,
          transferId: lastTransaction?.transferId ? lastTransaction.transferId + 1 : transferId,
        };
        details.push(record);
        localStorage.setItem(accountKey, JSON.stringify(details));
      }
      newDate = moment(newDate).add(1, "months");
    }
  }

  addBiWeeklyTransaction(accountKey: string, transaction: any, transferId: number, date: any): void {
    let accountActivityForMonthly = localStorage.getItem(accountKey);
    let lastTransactionMonthly: any;
    if (accountActivityForMonthly) {
      const details = JSON.parse(accountActivityForMonthly);
      lastTransactionMonthly = details[details.length - 1];
    }
    let newDate = transaction.date;
    for (let i=0; i<28; i++) {
      this.addRecord(accountKey, newDate, transaction, transferId, lastTransactionMonthly);
      newDate =  moment(newDate).add(14, "days");
    }
  }

  addRecord(accountKey: string, newDate: Date, transaction: any, transferId: number, lastTransactionMonthly: any): void {
    let accountActivity = localStorage.getItem(accountKey);
    if (accountActivity) {
      const details = JSON.parse(accountActivity);
      const lastTransaction = details[details.length - 1];
      const record = {
        id: lastTransaction.id + 1,
        date: newDate,
        amount: transaction.amount,
        description: transaction.description,
        type: transaction.type,
        groupId: lastTransactionMonthly?.groupId ? lastTransactionMonthly.groupId + 1 : GROUP_IDS.SAVING_ACCOUNT,
        transferId: lastTransaction?.transferId ? lastTransaction.transferId + 1 : transferId

      };
      details.push(record);
      localStorage.setItem(accountKey, JSON.stringify(details));
    }
  }
}
