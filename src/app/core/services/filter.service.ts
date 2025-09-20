// Core modules
import { Injectable } from '@angular/core';

// Third party modules
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  public setDate = new Subject<string>();
  public selectedDate: string;
  public accountOpeningDate: Date  | null; 
  constructor() { }

  getSelectedDate(): Observable<any> {
    return this.setDate.asObservable();
  }
}
