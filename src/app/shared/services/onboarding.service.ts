import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';

export interface OnboardingState {
  bankLinked: boolean;
  hasFunded: boolean;
}

/**
 * Tracks first-run onboarding state for the brokerage flow.
 * Mirrors the BehaviorSubject + localStorage pattern used by the other
 * `investing_sim__*` services (e.g. CurrentDateService).
 */
@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private readonly ONBOARDING_KEY = 'investing_sim__onboarding';

  private stateSubject = new BehaviorSubject<OnboardingState>(this.getStoredState());
  public state$ = this.stateSubject.asObservable();
  public bankLinked$: Observable<boolean> = this.state$.pipe(map(s => s.bankLinked));
  public hasFunded$: Observable<boolean> = this.state$.pipe(map(s => s.hasFunded));

  constructor() {
    // Ensure the current state is persisted on first creation.
    this.saveState(this.stateSubject.value);
  }

  get bankLinked(): boolean {
    return this.stateSubject.value.bankLinked;
  }

  get hasFunded(): boolean {
    return this.stateSubject.value.hasFunded;
  }

  setBankLinked(value: boolean): void {
    this.update({ bankLinked: value });
  }

  setHasFunded(value: boolean): void {
    this.update({ hasFunded: value });
  }

  private update(patch: Partial<OnboardingState>): void {
    const next: OnboardingState = { ...this.stateSubject.value, ...patch };
    this.stateSubject.next(next);
    this.saveState(next);
  }

  private getStoredState(): OnboardingState {
    const fallback: OnboardingState = { bankLinked: false, hasFunded: false };
    try {
      const stored = localStorage.getItem(this.ONBOARDING_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return { ...fallback, ...parsed };
        }
      }
    } catch (error) {
      console.warn('Error reading onboarding state from localStorage:', error);
    }
    return fallback;
  }

  private saveState(state: OnboardingState): void {
    try {
      localStorage.setItem(this.ONBOARDING_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving onboarding state to localStorage:', error);
    }
  }
}
