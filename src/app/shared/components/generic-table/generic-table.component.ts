// Core modules
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';

// Material modules
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

// Services
import { CommonService } from '@core/services/common.service';

@Component({
  selector: 'app-generic-table',
  templateUrl: './generic-table.component.html',
  styleUrls: ['./generic-table.component.scss'],
})
export class GenericTableComponent implements OnChanges, OnInit {
  @Input() columns: any[] = [];
  @Input() dataSource: any[] = [];
  @Input() pageSize = 25;
  @Input() isPlanList = false;

  @Output() rowClick = new EventEmitter();
  @Output() actionHandler = new EventEmitter<any>();
  @Output() infoActionHandler = new EventEmitter<any>();

  @ViewChild(MatPaginator, { static: true })
  paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true })
  sort!: MatSort;

  displayedColumns: string[] = [];
  tableDataSource = new MatTableDataSource<any>();
  previous = '';
  isAccountActivity: false;

  constructor(
    private commonService: CommonService
  ) {
  }

  ngOnInit(): void {
    this.displayedColumns = this.columns.map((column) => column.columnDef);
    this.commonService.getSearch().subscribe((value) => this.filterTable(value));
  }

  ngOnChanges(): void {
    if (this.dataSource) {
      this.tableDataSource = new MatTableDataSource(this.dataSource);
      this.tableDataSource.paginator = this.paginator;
      // this.tableDataSource.sort = this.sort;
    }
  }

  filterTable(str: string): void {
    this.tableDataSource.filter = str;
  }

  onRowClick(row: any, index: number): void {
    this.rowClick.emit(row);
  }

  onClickAction(row: any, actionName: string): void {
    this.actionHandler.emit({ row, actionName });
  }
}
