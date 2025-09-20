// Core modules
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

// Angular forms
import { AbstractControl, FormBuilder, FormControl, FormGroup } from '@angular/forms';

// Services
import { CommonService } from '@core/services/common.service';

@Component({
  selector: 'app-choose-account',
  templateUrl: './choose-account.component.html',
  styleUrls: ['./choose-account.component.scss'],
})
export class ChooseAccountComponent implements OnInit {
  @Input() account = 'checking';
  @Output() clickHandler = new EventEmitter<any>();
  @Output() filterGrid = new EventEmitter<any>();
  @Input() isSearch = false;
  searchForm: FormGroup;
  previous = '';
  accountType = "2";
  
  constructor(private fb: FormBuilder, private commonService: CommonService) {
    this.searchForm = this.fb.group({
      search: new FormControl(),
    });
  }

  ngOnInit(): void {
    if (this.account === 'saving') {
      this.accountType = "1"
    } 
  }

  radioChange(event: any): void {
    this.accountType = event;
    this.clickHandler.emit(event);
  }

     clearSearch(): void {
      this.search?.setValue('');
      this.filterTable('');
    }
  
    filterTable(event: any): void {
      if (event) {
        this.commonService.search.next(event.target.value);
      } else {
        this.commonService.search.next('');
      }
    }

  get search(): AbstractControl | null {
    return this.searchForm.get('search');
  }
}
