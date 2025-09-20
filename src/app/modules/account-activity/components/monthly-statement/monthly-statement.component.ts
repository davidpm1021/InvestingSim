// Core modules
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

// Services
import { CommonService } from '@core/services/common.service';
import { ACCOUNT_TYPE } from '@shared/models/common';

@Component({
  selector: 'app-monthly-statement',
  templateUrl: './monthly-statement.component.html',
  styleUrls: ['./monthly-statement.component.scss'],
})
export class MonthlyStatementComponent implements OnInit {
  public columns = [
    {
      columnDef: 'statement',
      header: 'Statement',
      cell: (element: any) => `${element.month}, ${element.year}`,
    },
    {
      columnDef: 'view',
      header: 'View',
      isAction: true,
      actionName: 'View',
    }
  ];
  public dataSource: {month: string, year: number}[] = [];
  title: string = ACCOUNT_TYPE.CHECKING;
  selectedYear: any;
  selectedMonth: any;
  selectedAccount: string;

  constructor(private router: Router, private commonService: CommonService) {}

  ngOnInit(): void {
    
    const {monthsArray, yearArray} = this.commonService.getMonthlyStatementArray(); 
    monthsArray.reverse();
    yearArray.reverse();
    monthsArray.forEach((data, i) => {
      const dataSourceObj = {month: '', year : this.getCurrentYear()};
      dataSourceObj.month = this.commonService.monthObject[data];
      dataSourceObj.year = yearArray[i];
      this.dataSource.push(dataSourceObj);
    })
  }

  actionHandler(event: any): void {
    if (event.actionName === 'View') {
      this.router.navigate(['/account/view-statement'], {
        queryParams: {
          month: event.row.month,
          year: event.row.year,
          account: this.title,
        },
      });
    } else {
      this.selectedYear = event.row.year;
      this.selectedMonth = event.row.month;
      this.selectedAccount = this.title;
    }
  }

  getCurrentYear(): number {
    return this.commonService.getCurrentYear();
  }

  clickHandler(event: any): void {
    if (event === '1') {
      this.title = ACCOUNT_TYPE.SAVINGS;
    } else {
      this.title = ACCOUNT_TYPE.CHECKING;
    }
  }

}
