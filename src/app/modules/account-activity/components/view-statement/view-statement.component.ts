// Core modules
import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';

// Application component
import { PdfViewDialogComponent } from '@shared/components/pdf-view-dialog/pdf-view-dialog.component';

// Services
import { TransactionService } from '@core/services/transaction.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Subscription } from 'rxjs';
import { CommonService } from '@app/core/services/common.service';
import * as moment from 'moment';
import { ACCOUNT_TYPE } from '@shared/models/common';
import { AccountService } from '@core/services/account.service';

@Component({
  selector: 'app-view-statement',
  templateUrl: './view-statement.component.html',
  styleUrls: ['./view-statement.component.scss'],
})
export class ViewStatementComponent implements OnInit {
  public columns = [
    {
      columnDef: 'date',
      header: 'Date',
      cell: (element: any) => `${element.date}`,
      type: 'date',
    },
    {
      columnDef: 'description',
      header: 'Description',
      cell: (element: any) => `${element.description}`,
    },
    {
      columnDef: 'amount',
      header: 'Amount',
      cell: (element: any) => `${element.amount}`,
      type: 'number',
    },
    {
      columnDef: 'balance',
      header: 'Balance',
      cell: (element: any) => `${element.balance}`,
      type: 'number',
    },
  ];
  @Input() selectedYear: string;
  @Input() selectedMonth: string;
  @Input() accountType: string;
  

  dataSource = [];
  withdrawls = 0;
  additions = 0;
  initialAmount: number = 0;
  lastAmount: number = 0;
  private subscriptions = new Subscription();
  accountNumbers: any;
  routingNumbers: any;

  constructor(
    private route: ActivatedRoute,
    private transactionService: TransactionService,
    private dialog: MatDialog,
    private commonService: CommonService,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.route.queryParams.subscribe((params: any) => {
      this.selectedMonth = params.month;
      this.selectedYear = params.year;
      this.accountType = params.account;
      this.getAccountNumbers();
      this.getTransactionsForTheMonth();
    }));
  }

  getAccountNumbers(): void {
    this.accountNumbers = this.accountService.checkingAccountNumners;
    this.routingNumbers = this.accountService.checkingRouteNumbers;
    if (this.accountType === ACCOUNT_TYPE.SAVINGS) {
      this.accountNumbers = this.accountService.savingAccountNumners;
      this.routingNumbers = this.accountService.savingRouteNumbers;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  getFilteredData(account: any): any {
    if (account) {
      const startDate = new Date(
        Number(this.selectedYear),
        this.commonService.monthMap[this.selectedMonth],
        1
      );
      const lastDate = new Date(
        Number(this.selectedYear),
        this.commonService.monthMap[this.selectedMonth] + 1,
        0
      );
      const filteredData = account?.filter((item: any) =>
        moment(item.date).isBetween(startDate, lastDate, undefined, '[]')
      );
      return filteredData;
    }
  }

  getTransactionsForTheMonth(): void {
    this.subscriptions.add(this.transactionService.getMonthlyTransactions(
      this.selectedMonth,
      this.selectedYear,
      this.accountType
    ).subscribe((data: any) => {
      this.dataSource = this.getFilteredData(data);
      const initialTransaction: any = this.dataSource[0];
      const lastTransaction: any = this.dataSource[this.dataSource.length - 1];
      if (initialTransaction) {
        this.initialAmount = initialTransaction.balance;
      }

      this.lastAmount = lastTransaction?.balance || 0;
      this.dataSource.forEach((data: any) => {
        if (Number(data.amount) < 0) {
          this.withdrawls += Number(data.amount);
        } else {
          this.additions += Number(data.amount);
        }
      });
    }));
  }

  public convertToPDF() {
    var data = document.getElementById('view');
    if (data) {
      html2canvas(data).then((canvas) => {
        // Few necessary setting options
        const contentDataURL = canvas.toDataURL('image/png');
        let pdf = new jsPDF('p', 'mm', 'a4'); // A4 size page of PDF
        var width = pdf.internal.pageSize.getWidth();
        var height = (canvas.height * width) / canvas.width;
        pdf.addImage(contentDataURL, 'PNG', 10, 10, width, height);
        // pdf.save('statement.pdf'); // Generated PDF
        const pdfSrc = pdf.output('blob'); // Generated PDF
        const dialogRef = this.dialog.open(PdfViewDialogComponent, {
          width: '100%',
          height: '80vh',
          data: { pdfSrc },
        });

        dialogRef.afterClosed().subscribe(() => { });
      });
    }
  }
}
