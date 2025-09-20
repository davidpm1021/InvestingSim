// Core modules
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

// Third party modules
import { Observable, Subject } from 'rxjs';
import { FilterService } from './filter.service';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  public search = new Subject();
  public monthMap: {[key:string]: number} = {
    'January' :  0,
    'February' :  1,
    'March' :  2,
    'April' :  3,
    'May' :  4,
    'June' :  5,
    'July' :  6,
    'August' :  7,
    'September' :  8,
    'October' :  9,
    'November' :  10,
    'December' :  11
  }

  public monthObject: {[key:number]: string} = {
    0: 'January', 
    1: 'February', 
    2: 'March',
    3: 'April',
    4: 'May', 
    5: 'June', 
    6: 'July', 
    7: 'August', 
    8: 'September', 
    9: 'October', 
    10: 'November',
    11: 'December' 
  }
  constructor(
    private filterService: FilterService,
    private httpClient: HttpClient
  ) { }

  getCurrentYear(date?: any): number {
    if (date) {
      return new Date(date).getFullYear();
    } else 
    return (new Date()).getFullYear();
  } 

  getCurrentMonth(date?: any): number {
    if (date) {
      return new Date(date).getMonth();
    } else 
    if (this.filterService.selectedDate) {
      return new Date(this.filterService.selectedDate).getMonth();
    } else {
      return new Date().getMonth();
    }
  }

  getCurrentDate(): number {
    if (this.filterService.selectedDate) {
      return new Date(this.filterService.selectedDate).getDate();
    } else {
      return new Date().getDate();
    }
  }

  getTwelveMonthsArray(date?: any) : {monthsArray: number[], yearArray: number[]} {
    let monthsArray: number[] = [];
    let yearArray: number [] = []
    const month = this.getCurrentMonth(date);
    let startMonth = month;
    for (let i=0; i<12; i++) {
       if (startMonth <12) {
        monthsArray.push(startMonth);
        yearArray.push(this.getCurrentYear(date))
       } else {
         monthsArray.push(startMonth - 12);
         yearArray.push(this.getCurrentYear(date) + 1)
       }
       startMonth++;
    }
    return {monthsArray, yearArray}
  }

  getMonthlyStatementArray(): {monthsArray: number[], yearArray: number[]} {
    let monthsArray: number[] = [];
    let yearArray: number [] = [];
    const accountOpeningDate = this.filterService.accountOpeningDate;
    if (accountOpeningDate) {
    let startMonth = new Date(accountOpeningDate).getMonth();
    let startYear = new Date(accountOpeningDate).getFullYear();
    const currentMonth = this.getCurrentMonth();
    let currentYear = new Date().getFullYear();
    if (this.filterService.selectedDate) {
       currentYear = new Date(this.filterService.selectedDate).getFullYear();
    }
    if (startYear === currentYear) {
      while (startMonth < currentMonth) {
        monthsArray.push(startMonth);
        startMonth++;
        yearArray.push(currentYear);
      }
    } else if (startYear < currentYear){
      while(startMonth < 12 ) {
        monthsArray.push(startMonth);
        startMonth++;
        yearArray.push(startYear);
      }
      let count =0;
      while (count <currentMonth) {
        monthsArray.push(count);
        count++;
        yearArray.push(startYear + 1);
      }
    }
    }
    return {monthsArray, yearArray}
  }

  getShoppingListFromFile(): Observable<any> {
    return this.httpClient.get("assets/config/shopping.json");
  }

  getInitialTransaction(): Observable<any> {
    return this.httpClient.get("assets/config/initial-transaction.json");
  }

  getAddressList(): Observable<any> {
    return this.httpClient.get("assets/config/address.json");
  }

  public getSearch(): Observable<any> {
    return this.search.asObservable();
  }
}
