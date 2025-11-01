import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { QUARTERS } from '../data/quarters.data';

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
  }

  /**
   * Get stored current date from local storage
   */
  private getStoredCurrentDate(): string {
    try {
      const stored = localStorage.getItem(this.CURRENT_DATE_KEY);
      if (stored && this.isValidDateString(stored)) {
        return stored;
      }
    } catch (error) {
      console.warn('Error reading current date from localStorage:', error);
    }
    
    // Default to Quarter 1 (January 1, 2025)
    return '2025-01-01';
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
