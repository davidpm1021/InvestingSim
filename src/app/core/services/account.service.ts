import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from "rxjs";
import {map} from "rxjs/operators";
import * as moment from 'moment';

import {FilterService} from './filter.service';
import {
  ACCOUNT_TYPE,
  DESCRIPTIONS,
  GROUP_IDS,
  IDS,
  NOTIFICATIONS,
  SESSION_STORAGE,
  TRANSACTION_TYPE,
  TRANSFER_IDS
} from '@app/shared/models/common';
import {combineLatest} from 'rxjs';
import {ITransaction} from '@shared/models/account.model';
import {CommonService} from './common.service';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private accountsBS: BehaviorSubject<any>;
  private accounts: Observable<[]>;
  public notificationCount = 0;

  public savingAccountNumners = [
    100000111,
  ]
  public checkingAccountNumners = [
    110000111,
  ]

  public savingRouteNumbers = [
    120000111
  ]

  public checkingRouteNumbers = [
    120000111
  ]

  constructor(private filterService: FilterService, private commonService: CommonService) {
    this.accountsBS = new BehaviorSubject([]);
    this.accounts = this.accountsBS.asObservable();
  }

  updateAccounts() {
    this.notificationCount = 0;
    this.accountsBS.next(this.getAccountsFromLocalStorage());
  }

  getAccountsFromLocalStorage() {

    const checking = localStorage.getItem('checkingAccountActivity');
    const checkingJson: any[] = checking ? JSON.parse(checking) : [];

    const savings = localStorage.getItem('savingAccountActivity');
    const savingsJson: any[] = savings ? JSON.parse(savings) : [];

    const bills = localStorage.getItem('bills');
    const billsJson: any[] = bills ? JSON.parse(bills) : [];

    checkingJson.forEach(account => {
      account.accountType = 'checking';
    });

    savingsJson.forEach(account => {
      account.accountType = 'savings';
    });

    billsJson.forEach(account => {
      account.accountType = 'checking';
    });

    let allTransactions = [...checkingJson, ...savingsJson, ...billsJson];

    allTransactions = allTransactions.sort((a: any, b: any) => {
      if (a.date == b.date) {
        return a.id - b.id;
      } else {
        return a.date < b.date ? -1 : 1;
      }
    });

    let balances: { [key: string]: number; } = {
      checking: 0,
      savings: 0
    }

    let invalidTransactions: any = [];

    allTransactions.forEach((transaction, transactionIndex) => {

      let accountType = '';
      if (transaction.accountType === 'checking') {
        accountType = 'checking';
      } else if (transaction.accountType === 'savings') {
        accountType = 'savings';
      }

      if (!transaction.description && transaction.recipient) {
        transaction.description = 'Payment to: ' + transaction.recipient;
      }

      let checkIfBalanceIsNegative = balances[accountType] + transaction.amount;

      const notifications = this.getNotificationsLimit();
      let lowerLimit = NOTIFICATIONS.LOWER_LIMIT;
      let upperLimit = NOTIFICATIONS.UPPER_LIMIT;
      if (notifications) {
        lowerLimit = notifications.lowerLimit;
        upperLimit = notifications.upperLimit;
      }

      if (invalidTransactions.includes(transaction.transferId)) {
        transaction.notificationText = `<div>(${accountType.toUpperCase()}) Failed: ${transaction.description} for $${Math.abs(transaction.amount)}</div>`;
        transaction.description = `(${accountType.toUpperCase()}) Failed: ${transaction.description} for $${Math.abs(transaction.amount)}`;
        transaction.balance = balances[accountType];
        transaction.isValid = false;
      } else {
        transaction.notificationText = '';
        if (checkIfBalanceIsNegative < 0 && transaction.description !== 'Overdraft Fee') {
          if (transaction.type === 'transfer') {
            transaction.balance = balances[accountType];
            transaction.notificationText += `<div>(${accountType.toUpperCase()}) Failed: ${transaction.description} for $${Math.abs(transaction.amount)}</div>`;
            transaction.description = `(${accountType.toUpperCase()}) Failed: ${transaction.description} for $${Math.abs(transaction.amount)}`;
            invalidTransactions.push(transaction.transferId);
            transaction.isValid = false;
          } else {
            allTransactions.splice(transactionIndex + 1, 0, {
              id: transaction ? transaction.id + 1 : IDS.BILL_FEES,
              description: 'Overdraft Fee',
              amount: -35,
              date: transaction.date,
              balance: Number(checkIfBalanceIsNegative) - 35,
              notificationText: '<div>(${accountType.toUpperCase()}) Overdraft Fee for $35</div>',
              accountType: accountType
            });
            transaction.notificationText += `<div>(${accountType.toUpperCase()}) Low balance alert: Your account has gone negative</div>`;
            transaction.balance = balances[accountType] + Number(transaction.amount);
            balances[accountType] += Number(transaction.amount)
            transaction.isValid = true;


            if (checkIfBalanceIsNegative < lowerLimit) {
              transaction.notificationText += `<div>(${accountType.toUpperCase()}) Low Balance Alert: your balance is now below $${lowerLimit}</div>`;
            }
            if (Math.abs(transaction.amount) > upperLimit) {
              transaction.notificationText += `<div>(${accountType.toUpperCase()}) Transaction above $${upperLimit}: ${transaction.description} for $${Math.abs(transaction.amount)}</div>`;
            }

          }

        } else {

          if (checkIfBalanceIsNegative < lowerLimit) {
            transaction.notificationText += `<div>(${accountType.toUpperCase()}) Low Balance Alert: your balance is now below $${lowerLimit}</div>`;
          }
          if (Math.abs(transaction.amount) > upperLimit) {
            transaction.notificationText += `<div>(${accountType.toUpperCase()}) Transaction above $${upperLimit}: ${transaction.description} for $${Math.abs(transaction.amount)}</div>`;
          }
          transaction.balance = balances[accountType] + Number(transaction.amount);
          balances[accountType] += Number(transaction.amount)
          transaction.isValid = true;
        }




      }

    });

    allTransactions = allTransactions.sort((a: any, b: any) => {
      if (a.date == b.date) {
        return b.id - a.id;
      } else {
        return a.date < b.date ? 1 : -1;
      }
    });

    return allTransactions;

  }

  getAllSavingTransactions() {
    return this.accounts.pipe(map(accounts => {
      return accounts.filter((account: any) => (account.accountType === 'savings'));
    }));
  }

  getAllCheckingTransactions() {
    return this.accounts.pipe(map(accounts => {
      return accounts.filter((account: any) => (account.accountType === 'checking'));
    }));
  }

  getCheckingTransactions() {
    return this.accounts.pipe(map(accounts => {
      return accounts.filter((account: any) => (account.accountType === 'checking' && account.isValid));
    }));
  }

  getPastCheckingTransactions() {
    return this.getCheckingTransactions().pipe(map(accounts => {
      return accounts.filter((account: any) => moment(account.date).isBetween(
        this.filterService.accountOpeningDate,
        this.filterService.selectedDate,
        undefined,
        '[]'
      ));
    }));
  }

  getPastAllTransactions() {
    return this.accounts.pipe(map(accounts => {
      return accounts.filter((account: any) => moment(account.date).isBetween(
        this.filterService.accountOpeningDate,
        this.filterService.selectedDate,
        undefined,
        '[]'
      ));
    }));
  }

  getSavingsBalance() {
    return this.getPastSavingsTransactions().pipe(map(arr => arr[0]['balance']));
  }

  getCheckingsBalance() {
    return this.getPastCheckingTransactions().pipe(map(arr => arr[0]['balance']));
  }

  getSavingsTransactions() {
    return this.accounts.pipe(map(accounts => {
      return accounts.filter((account: any) => (account.accountType === 'savings' && account.isValid));
    }));
  }

  getPastSavingsTransactions() {
    return this.getSavingsTransactions().pipe(map(accounts => {
      return accounts.filter((account: any) => moment(account.date).isBetween(
        this.filterService.accountOpeningDate,
        this.filterService.selectedDate,
        undefined,
        '[]'
      ));
    }));
  }

  getAllPastSavingTransaction() {
    return this.getAllSavingTransactions().pipe(map(accounts => {
      return accounts.filter((account: any) => moment(account.date).isBetween(
        this.filterService.accountOpeningDate,
        this.filterService.selectedDate,
        undefined,
        '[]'
      ));
    }));
  }

  getAllPastCheckingTransaction() {
    return this.getAllCheckingTransactions().pipe(map(accounts => {
      return accounts.filter((account: any) => moment(account.date).isBetween(
        this.filterService.accountOpeningDate,
        this.filterService.selectedDate,
        undefined,
        '[]'
      ));
    }));
  }

  getNotifications() {
    return combineLatest([this.getPastAllNotifications(), of([])])
  }

  getPastSavingNotifications(): Observable<any> {
    return this.getAllPastSavingTransaction().pipe(map(accounts => {
      return this.filterBelowAndUpperLimit(accounts);
    }));
  }


  getPastCheckingNotifications(): Observable<any> {
    return this.getAllPastCheckingTransaction().pipe(map(accounts => {
      return this.filterBelowAndUpperLimit(accounts);
    }));
  }

  getPastAllNotifications(): Observable<any> {
    return this.getPastAllTransactions().pipe(map(accounts => {
      return this.filterBelowAndUpperLimit(accounts);
    }));
  }

  getPastBillsTransactions() {
    return this.getPastCheckingTransactions().pipe(map(accounts => {
      return accounts.filter((account: any) => account.type === TRANSACTION_TYPE.BILL && !account.doNotDisplayBill);
    }));
  }

  getUpcomingBillsTransactions() {
    return this.getUpcomingCheckingTransactions().pipe(map(accounts => {
      return accounts.filter((account: any) => account.type === TRANSACTION_TYPE.BILL && !account.doNotDisplayBill);
    }));
  }

  getUpcomingCheckingTransactions() {
    return this.getCheckingTransactions().pipe(map(accounts => {
      return accounts.filter((account: any) => moment(account.date).isAfter(this.filterService.selectedDate));
    }));
  }

  getCheckingTransfersAll() {
    return this.accounts.pipe(map(accounts => {
      return accounts.filter((account: any) => (account.type === 'transfer' && account.accountType === 'checking' && account.isValid));
    }));
  }

  getPastCheckingTransfers() {
    return this.getCheckingTransfersAll().pipe(map(accounts => {
      return accounts.filter((account: any) => moment(account.date).isBetween(
        this.filterService.accountOpeningDate,
        this.filterService.selectedDate,
        undefined,
        '[]'
      ));
    }));
  }

  getUpcomingCheckingTransfers() {
    return this.getCheckingTransfersAll().pipe(map(accounts => {
      return accounts.filter((account: any) => moment(account.date).isAfter(this.filterService.selectedDate));
    }));
  }

  getSavingsTransfersAll() {
    return this.accounts.pipe(map(accounts => {
      return accounts.filter((account: any) => (account.type === 'transfer' && account.accountType === 'savings' && account.isValid));
    }));
  }

  getPastSavingTransfers() {
    return this.getSavingsTransfersAll().pipe(map(accounts => {
      return accounts.filter((account: any) => moment(account.date).isBetween(
        this.filterService.accountOpeningDate,
        this.filterService.selectedDate,
        undefined,
        '[]'
      ));
    }));
  }

  getUpcomingSavingsTransfers() {
    return this.getSavingsTransfersAll().pipe(map(accounts => {
      return accounts.filter((account: any) => moment(account.date).isAfter(this.filterService.selectedDate));
    }));
  }

  deleteSavingAccountTransaction(event: any): void {
    const savingActivity = localStorage.getItem(SESSION_STORAGE.SAVING_ACCOUNT);
    if (savingActivity) {
      const savingAccountTransaction = JSON.parse(savingActivity);
      let filteredTransactions = savingAccountTransaction.filter((element: any) => element.id !== event.id);
      if (event.groupId) {
        filteredTransactions = savingAccountTransaction.filter((element: any) => element.groupId !== event.groupId);
      }
      localStorage.setItem(SESSION_STORAGE.SAVING_ACCOUNT, JSON.stringify(filteredTransactions));
    }
    this.updateAccounts();
  }

  deleteCheckingAccountTransaction(event: any): void {
    const checkActivity = localStorage.getItem(SESSION_STORAGE.CHECKING_ACCOUNT);
    if (checkActivity) {
      const checkingAccountTransactions = JSON.parse(checkActivity);
      let filteredTransactions = checkingAccountTransactions.filter((element: any) => element.id !== event.id);
      if (event.groupId) {
        filteredTransactions = checkingAccountTransactions.filter((element: any) => element.groupId !== event.groupId);
      }
      localStorage.setItem(SESSION_STORAGE.CHECKING_ACCOUNT, JSON.stringify(filteredTransactions));
    }
    this.updateAccounts();
  }

  deleteBill(event: any): void {
    const bills = localStorage.getItem(SESSION_STORAGE.BILLS);
    if (bills) {
      const billsTransactions = JSON.parse(bills);
      let filteredTransactions = billsTransactions.filter((element: any) => element.id !== event.id)
      if (event.groupId) {
        filteredTransactions = billsTransactions.filter((element: any) => element.groupId !== event.groupId)
      }
      if (filteredTransactions.length) {
        localStorage.setItem(SESSION_STORAGE.BILLS, JSON.stringify(filteredTransactions));
      } else {
        localStorage.setItem(SESSION_STORAGE.BILLS, '');
      }
    } else {
      localStorage.setItem(SESSION_STORAGE.BILLS, '');
    }
    this.updateAccounts();
  }

  filterCurrentDataSource(dataSource: any[], event: any): any[] {
    dataSource = dataSource.filter((element: any) => element.id !== event.id);
    if (event.groupId) {
      dataSource = dataSource.filter((element: any) => element.groupId !== event.groupId);
    }
    return dataSource;
  }

  filterFirstRecordForRecurring(data: any[]): any[] {
    const alreadyShown: any = [];
    const filteredData: any = [];
    data.reverse().forEach((item: any) => {
      if (item.groupId && !alreadyShown.includes(item.groupId)) {
        alreadyShown.push(item.groupId);
        filteredData.push(item);
      }
    });
    return filteredData;
  }

  filterBelowAndUpperLimit(transactions: any[]): any {
    const notifications = this.getNotificationsLimit();
    let lowerLimit = NOTIFICATIONS.LOWER_LIMIT;
    let upperLimit = NOTIFICATIONS.UPPER_LIMIT;
    if (notifications) {
      lowerLimit = notifications.lowerLimit;
      upperLimit = notifications.upperLimit;
    }
    const filteredData = transactions.filter(
      (transaction: any) =>
        (transaction.balance < lowerLimit ||
          Math.abs(transaction.amount) > upperLimit ||
          !transaction.isValid) && !(transaction.accountType === 'savings' && transaction.type === 'transfer')
    );
    return filteredData;
  }

  insertTransaction(accountType: string, transaction: ITransaction): void {
    const accountActivity = localStorage.getItem(accountType);
    if (accountActivity) {
      const transactions = JSON.parse(accountActivity);
      const lastTransaction = transactions[transactions.length - 1];
      const checkingTransaction = {
        id: lastTransaction.id + 1,
        date: this.filterService.selectedDate,
        amount: transaction.amount,
        description: transaction.description,
        type: transaction.type
      };
      transactions.push(checkingTransaction);
      localStorage.setItem(accountType, JSON.stringify(transactions));
    }
    this.updateAccounts();
  }

  addSingleBillToTransaction(accountType: string, transactionData: any): void {
    const billsList = localStorage.getItem(accountType);
    if (billsList) {
      const transactions = JSON.parse(billsList);
      const lastRecordInList = transactions[transactions.length - 1];
      const transaction = {
        ...transactionData,
        id: lastRecordInList.id + 1,
        amount: -transactionData.amount,
        type: TRANSACTION_TYPE.BILL,
        transferId: lastRecordInList?.transferId ? lastRecordInList.transferId + 1 : TRANSFER_IDS.PAY_BILL,
        groupId: lastRecordInList.groupId ? lastRecordInList.groupId + 1 : GROUP_IDS.PAY_BILL
      };
      transactions.push(transaction);
      localStorage.setItem(accountType, JSON.stringify(transactions));
    } else {
      const billRecord = {
        ...transactionData,
        amount: -transactionData.amount,
        type: TRANSACTION_TYPE.BILL,
        transferId: TRANSFER_IDS.PAY_BILL,
        groupId: GROUP_IDS.PAY_BILL
      };
      localStorage.setItem(accountType, JSON.stringify([billRecord]));
    }
    this.updateAccounts();
  }

  addRecurringBillTransaction(accountType: string, transactionData: any): void {
    const activities = localStorage.getItem(accountType);
    let lastRecordInList: any = null;
    if (activities) {
      const transactions = JSON.parse(activities);
      lastRecordInList = transactions[transactions.length - 1];
    }
    let newDate:any = moment(transactionData.date);

    for (let i=0; i<12; i++) {
      const data = localStorage.getItem(accountType);
      if (data) {
        const transactions = JSON.parse(data);
        const lastRecord = transactions[transactions.length - 1];
        const transaction = {
          ...transactionData,
          date: newDate,
          id: lastRecord.id + 1,
          amount: -transactionData.amount,
          groupId: lastRecordInList?.groupId ? lastRecordInList.groupId + 1 : GROUP_IDS.PAY_BILL,
          type: TRANSACTION_TYPE.BILL,
          transferId: lastRecordInList?.transferId ? lastRecordInList.transferId + 1 : TRANSFER_IDS.PAY_BILL
        };
        transactions.push(transaction);
        localStorage.setItem(accountType, JSON.stringify(transactions));
      } else {
        const transaction = {
          ...transactionData,
          date: newDate,
          amount: -transactionData.amount,
          groupId: GROUP_IDS.PAY_BILL,
          type: TRANSACTION_TYPE.BILL,
          transferId: TRANSFER_IDS.PAY_BILL
        };
        localStorage.setItem(accountType, JSON.stringify([transaction]));
      }
      newDate = moment(newDate).add(1, "months");
    }    
    this.updateAccounts();
  }

  makeSingleTransfer(transactionData: any): void {
    let savingAccountActivity = localStorage.getItem(SESSION_STORAGE.SAVING_ACCOUNT);
    let checkingAccountActivity = localStorage.getItem(SESSION_STORAGE.CHECKING_ACCOUNT);
    let lastRecordInSavings: any = null;
    if (savingAccountActivity) {
      const details = JSON.parse(savingAccountActivity);
      lastRecordInSavings = details[details.length - 1];
      const savingTransaction = {
        id: transactionData.toAccount === ACCOUNT_TYPE.CHECKING ? lastRecordInSavings.id + 1 : lastRecordInSavings.id + 2,
        date: transactionData.date,
        amount: transactionData.toAccount === ACCOUNT_TYPE.CHECKING ? -transactionData.amount : transactionData.amount,
        description: transactionData.toAccount === ACCOUNT_TYPE.CHECKING ? DESCRIPTIONS.TRANSFER_TO_CHECKING : DESCRIPTIONS.TRANSFER_FROM_CHECKING,
        type: TRANSACTION_TYPE.TRANSFER,
        frequency: transactionData.frequency,
        groupId: lastRecordInSavings?.groupId ? lastRecordInSavings.groupId + 1 : GROUP_IDS.SAVING_ACCOUNT,
        transferId: lastRecordInSavings?.transferId ? lastRecordInSavings.transferId + 1 : TRANSFER_IDS.SAVING_ACCOUNT
      };
      details.push(savingTransaction);
      localStorage.setItem(SESSION_STORAGE.SAVING_ACCOUNT, JSON.stringify(details));
    }

    if (checkingAccountActivity) {
      const details = JSON.parse(checkingAccountActivity);
      const checkingTransaction = {
        id: transactionData.toAccount === ACCOUNT_TYPE.CHECKING ? lastRecordInSavings.id + 2 : lastRecordInSavings.id + 1,
        date: transactionData.date,
        amount: transactionData.toAccount === ACCOUNT_TYPE.CHECKING ? transactionData.amount : -transactionData.amount,
        description: transactionData.toAccount === ACCOUNT_TYPE.CHECKING ? DESCRIPTIONS.TRANSFER_FROM_SAVING : DESCRIPTIONS.TRANSFER_TO_SAVING,
        type: TRANSACTION_TYPE.TRANSFER,
        frequency: transactionData.frequency,
        groupId: lastRecordInSavings?.groupId ? lastRecordInSavings.groupId + 1 : GROUP_IDS.SAVING_ACCOUNT,
        transferId: lastRecordInSavings?.transferId ? lastRecordInSavings.transferId + 1 : TRANSFER_IDS.SAVING_ACCOUNT
      };
      details.push(checkingTransaction);
      localStorage.setItem(SESSION_STORAGE.CHECKING_ACCOUNT, JSON.stringify(details)
      );
    }
    this.updateAccounts();
  }

  makeRecurringTransfer(transactionData: any): void {
    let savingAccountActivity = localStorage.getItem(SESSION_STORAGE.SAVING_ACCOUNT);
    let checkingAccountActivity = localStorage.getItem(SESSION_STORAGE.CHECKING_ACCOUNT);
    let lastRecordInSavings: any = null;
    let lastRecordInSavingRecurring: any = null;
    if (savingAccountActivity) {
      const details = JSON.parse(savingAccountActivity);
      lastRecordInSavings = details[details.length - 1];
    }
    let newDate:any = moment(transactionData.date);

    for (let i=0; i<12; i++) {
      savingAccountActivity = localStorage.getItem(SESSION_STORAGE.SAVING_ACCOUNT);
      checkingAccountActivity = localStorage.getItem(SESSION_STORAGE.CHECKING_ACCOUNT);

      if (savingAccountActivity) {
        const details = JSON.parse(savingAccountActivity);
        lastRecordInSavingRecurring = details[details.length - 1];
        const savingTransaction = {
          id: transactionData.toAccount === ACCOUNT_TYPE.CHECKING ? lastRecordInSavingRecurring.id + 1 : lastRecordInSavingRecurring.id + 2,
          date: newDate,
          amount: transactionData.toAccount === ACCOUNT_TYPE.CHECKING ? -transactionData.amount : transactionData.amount,
          description: transactionData.toAccount === ACCOUNT_TYPE.CHECKING ? DESCRIPTIONS.TRANSFER_TO_CHECKING : DESCRIPTIONS.TRANSFER_FROM_CHECKING,
          type: TRANSACTION_TYPE.TRANSFER,
          frequency: transactionData.frequency,
          groupId: lastRecordInSavings?.groupId ? lastRecordInSavings.groupId + 1 : GROUP_IDS.SAVING_ACCOUNT,
          transferId: lastRecordInSavingRecurring?.transferId ? lastRecordInSavingRecurring.transferId + 1 : TRANSFER_IDS.SAVING_ACCOUNT
        };
        details.push(savingTransaction);
        localStorage.setItem(SESSION_STORAGE.SAVING_ACCOUNT, JSON.stringify(details));
      }

      if (checkingAccountActivity) {
        const details = JSON.parse(checkingAccountActivity);
        const checkingTransaction = {
          id: transactionData.toAccount === ACCOUNT_TYPE.CHECKING ? lastRecordInSavingRecurring.id + 2 : lastRecordInSavingRecurring.id + 2,
          date: newDate,
          amount: transactionData.toAccount === ACCOUNT_TYPE.CHECKING ? transactionData.amount : -transactionData.amount,
          description: transactionData.toAccount === ACCOUNT_TYPE.CHECKING ? DESCRIPTIONS.TRANSFER_FROM_SAVING : DESCRIPTIONS.TRANSFER_TO_SAVING,
          type: TRANSACTION_TYPE.TRANSFER,
          frequency: transactionData.frequency,
          groupId: lastRecordInSavings?.groupId ? lastRecordInSavings.groupId + 1 : GROUP_IDS.SAVING_ACCOUNT,
          transferId: lastRecordInSavingRecurring?.transferId ? lastRecordInSavingRecurring.transferId + 1 : TRANSFER_IDS.SAVING_ACCOUNT
        };
        details.push(checkingTransaction);
        localStorage.setItem(SESSION_STORAGE.CHECKING_ACCOUNT, JSON.stringify(details));
      }

    newDate=moment(newDate).add(1, "months");

    };

    this.updateAccounts();
  }

  getNotificationsLimit() {
    const notifications = localStorage.getItem(SESSION_STORAGE.NOTIFICATIONS);
    if (notifications) {
      return JSON.parse(notifications);
    } else {
      return null;
    }
  }
}
