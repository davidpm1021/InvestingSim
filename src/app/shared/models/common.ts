export enum IDS {
  CHECKING_ACCOUNT = 1200000,
  SAVING_ACCOUNT = 1100000,
  PAY_BILL = 1300000,
  RECIPIENT = 140000,
  DEPOSIST_CHECK= 1500000,
  BILL_FEES = 1600000
}

export enum GROUP_IDS {
  SAVING_ACCOUNT = 1700000,
  PAY_BILL = 1800000,
  CHECKING_ACCOUNT = 1900000
}

export enum TRANSFER_IDS {
  SAVING_ACCOUNT = 2000000,
  PAY_BILL = 2100000,
  SHOPPING = 2200000,
  CHECKING_ACCOUNT = 2300000
}

export enum ACCOUNT_TYPE  {
  SAVINGS = 'saving',
  CHECKING = 'checking'
}

export enum ACCOUNT_TITLE {
  SAVINGS = 'SAVINGS',
  CHECKINGS = 'CHECKINGS'
}

export enum SESSION_STORAGE {
  SAVING_ACCOUNT = 'savingAccountActivity',
  CHECKING_ACCOUNT = 'checkingAccountActivity',
  USER = 'user',
  RECIPIENT = 'recipients',
  BILLS = 'bills',
  SELECTED_DATE = 'selectedDate',
  ACCOUNT_OPENING_DATE = 'accountOpeningDate',
  INVALID_TRANSACTIONS = 'invalidTransactions',
  NOTIFICATIONS = 'notifications',
  FIRST_LOGIN = 'firstLogin',
  TEST_DATE = 'testDate'
}

export enum TRANSACTION_TYPE {
  TRANSFER = 'transfer',
  DEPOSIT = 'deposit',
  BILL ='bill',
  FEE  = 'fee'
}

export enum MESSAGES { 
  DEPSOIT_CHECK = 'You have successfully deposited your check.',
  CHECKING_ACCOUNT = 'Amount has been transferred to Checking Account',
  SAVING_ACCOUNT = 'Amount has been transferred to Saving Account',
  PAY_BILLS = 'Thank you !! Your bill payment has been scheduled',
  RECIPIENT = 'Payee added successfully. Please enter another.',
  RECIPIENT_UPDATE = 'Payee updated successfully.',
  RECIPIENT_DELETE = 'Payee deleted successfully.',
  SHOPPING = 'Transactions added successfully',
  MAKE_TRANSFER = 'You currently do not have enough money in the account complete this transfer.'
}

export enum NOTIFICATIONS {
  LOWER_LIMIT = 50,
  UPPER_LIMIT = 500
}

export enum OVERDRAFT {
  BILL_FEES = 35
}

export enum DESCRIPTIONS {
  DEPOSIT_CHECK_CHECKING = 'Deposit Check To Checking Account',
  DEPOSIT_CHECK_SAVING = 'Deposit Check to Saving Account',
  TRANSFER_TO_CHECKING = 'Transfer to Checking Account',
  TRANSFER_FROM_SAVING = 'Transfer from Saving Account',
  TRANSFER_TO_SAVING = 'Transfer to Saving Account',
  TRANSFER_FROM_CHECKING = 'Transfer from Checking Account'
}