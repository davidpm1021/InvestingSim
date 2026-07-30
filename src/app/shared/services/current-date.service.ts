import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { QUARTERS, SIM_YEAR_START, getQuarterForDate } from '../data/quarters.data';

@Injectable({
  providedIn: 'root'
})
export class CurrentDateService {
  private readonly CURRENT_DATE_KEY = 'investing_sim__current_date';
  
  // Current date BehaviorSubject
  private currentDateSubject = new BehaviorSubject<string>(this.getStoredCurrentDate());
  public currentDate$ = this.currentDateSubject.asObservable();

  constructor() {
    // Initialize with stored date on service creation
    this.initializeCurrentDate();
  }

  /**
   * Set the current date and save to local storage
   */
  setCurrentDate(date: string): void {
    this.currentDateSubject.next(date);
    this.saveCurrentDateToStorage(date);
  }

  /**
   * Get the current date value
   */
  getCurrentDate(): string {
    return this.currentDateSubject.value;
  }

  /**
   * Initialize current date from local storage or default
   */
  private initializeCurrentDate(): void {
    const storedDate = this.getStoredCurrentDate();
    this.currentDateSubject.next(storedDate);
    // Persist the resolved value so a snapped legacy/tampered date is cleaned up on disk.
    this.saveCurrentDateToStorage(storedDate);
  }

  /**
   * Get stored current date from local storage
   */
  private getStoredCurrentDate(): string {
    try {
      const stored = localStorage.getItem(this.CURRENT_DATE_KEY);
      if (stored && this.isValidDateString(stored)) {
        return this.snapToPlayableQuarter(stored);
      }
    } catch (error) {
      console.warn('Error reading current date from localStorage:', error);
    }

    // Default to the first playable quarter
    return SIM_YEAR_START;
  }

  /**
   * Resolve any calendar-valid date to a playable quarter's start value. A tampered or
   * legacy stored date that isn't itself a playable quarter value (mid-quarter, the
   * excluded Q4 2024, or out of range) would otherwise map to "Unknown Quarter" and the
   * header's quarter dropdown would find no match, disabling navigation and stranding the
   * user. Snap it to the start of its containing quarter, falling back to the first
   * playable quarter.
   */
  private snapToPlayableQuarter(date: string): string {
    const playable = this.getQuarterOptions();
    if (playable.some(o => o.value === date)) {
      return date;
    }
    const quarter = getQuarterForDate(date);
    if (quarter && playable.some(o => o.value === quarter.value)) {
      return quarter.value;
    }
    return SIM_YEAR_START;
  }

  /**
   * Save current date to local storage
   */
  private saveCurrentDateToStorage(date: string): void {
    try {
      localStorage.setItem(this.CURRENT_DATE_KEY, date);
    } catch (error) {
      console.error('Error saving current date to localStorage:', error);
    }
  }

  /**
   * Validate date string format (YYYY-MM-DD)
   */
  private isValidDateString(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      return false;
    }
    
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date.toISOString().split('T')[0] === dateString;
  }

  /**
   * Get quarter options for the dropdown
   * Excludes Q4 2024 since users can't navigate back to it
   */
  getQuarterOptions(): Array<{label: string, value: string}> {
    return QUARTERS.quarters
      .filter(quarter => quarter.value !== '2024-10-01') // Exclude Q4 2024 from dropdown
      .map(quarter => ({
        label: quarter.label,
        value: quarter.value
      }));
  }

  /**
   * Get quarter label for a given date string
   */
  getQuarterLabel(date: string): string {
    // Search full quarters array (not filtered dropdown options) to handle Q4 2024
    const matchingQuarter = QUARTERS.quarters.find(quarter => quarter.value === date);
    return matchingQuarter ? matchingQuarter.label : 'Unknown Quarter';
  }
}
