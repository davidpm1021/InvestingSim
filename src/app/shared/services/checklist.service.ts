import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { OnboardingService } from './onboarding.service';
import { HoldingsService } from './holdings.service';
import { TransactionsService } from './transactions.service';
import { CurrentDateService } from './current-date.service';
import { SIM_YEAR_START } from '../data/quarters.data';

/** The seven milestones the notebook checklist crosses off, in worksheet order. */
export type MilestoneKey =
  | 'connect'
  | 'fund'
  | 'buy'
  | 'advance'
  | 'statement'
  | 'sell'
  | 'withdraw';

export interface Milestone {
  key: MilestoneKey;
  label: string;
}

export const MILESTONES: Milestone[] = [
  { key: 'connect', label: 'Connect your bank' },
  { key: 'fund', label: 'Add money to invest' },
  { key: 'buy', label: 'Buy an investment' },
  { key: 'advance', label: 'Let a quarter pass' },
  { key: 'statement', label: 'Read a statement' },
  { key: 'sell', label: 'Sell a holding' },
  { key: 'withdraw', label: 'Cash out to your bank' },
];

/**
 * Tracks the student's progress through the seven headline actions of the
 * brokerage activity, so the notebook checklist can cross them off.
 *
 * Milestones are append-only: once done they stay done (transactions are an
 * append-only ledger, so deriving from them latches naturally). State also
 * persists to localStorage so a reload keeps every check. Five of the seven
 * derive from observables that already exist; only 'statement' has no data
 * trace, so it is marked explicitly from the statement dialog.
 *
 * Follows the BehaviorSubject + localStorage 'investing_sim__*' pattern used
 * by the other services (e.g. OnboardingService).
 */
@Injectable({ providedIn: 'root' })
export class ChecklistService {
  private readonly CHECKLIST_KEY = 'investing_sim__checklist';

  private completedSubject = new BehaviorSubject<Set<MilestoneKey>>(this.getStoredState());
  public completed$: Observable<Set<MilestoneKey>> = this.completedSubject.asObservable();

  constructor(
    private onboarding: OnboardingService,
    private holdings: HoldingsService,
    private transactions: TransactionsService,
    private currentDate: CurrentDateService,
  ) {
    // 1 & 2: connect + fund already have dedicated flags.
    this.onboarding.bankLinked$.subscribe(linked => { if (linked) this.complete('connect'); });
    this.onboarding.hasFunded$.subscribe(funded => { if (funded) this.complete('fund'); });

    // 3 & 6: buy + sell derived from the append-only holdings ledger.
    this.holdings.holdingTransactions$.subscribe(txns => {
      if (txns.some(t => t.action === 'buy')) this.complete('buy');
      if (txns.some(t => t.action === 'sell')) this.complete('sell');
    });

    // 4: any advance moves the sim date off the first playable quarter.
    this.currentDate.currentDate$.subscribe(date => {
      if (date !== SIM_YEAR_START) this.complete('advance');
    });

    // 7: a withdrawal (Withdraw Funds) posts a brokerage debit described
    // "Transfer to banking" (a deposit's brokerage side reads "Transfer from
    // banking", so this uniquely identifies cashing out).
    this.transactions.transactions$.subscribe(txns => {
      if (txns.some(t => t.account === 'brokerage001' && t.description === 'Transfer to banking')) {
        this.complete('withdraw');
      }
    });
  }

  isDone(key: MilestoneKey): boolean {
    return this.completedSubject.value.has(key);
  }

  /** Mark a milestone done (idempotent). Only emits/persists on an actual change. */
  complete(key: MilestoneKey): void {
    const current = this.completedSubject.value;
    if (current.has(key)) { return; }
    const next = new Set(current);
    next.add(key);
    this.completedSubject.next(next);
    this.saveState(next);
  }

  /** Clear all progress (for replaying the guide). */
  reset(): void {
    const empty = new Set<MilestoneKey>();
    this.completedSubject.next(empty);
    this.saveState(empty);
  }

  private getStoredState(): Set<MilestoneKey> {
    const valid = new Set(MILESTONES.map(m => m.key));
    try {
      const stored = localStorage.getItem(this.CHECKLIST_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return new Set(parsed.filter((k): k is MilestoneKey => valid.has(k)));
        }
      }
    } catch (error) {
      console.warn('Error reading checklist state from localStorage:', error);
    }
    return new Set<MilestoneKey>();
  }

  private saveState(state: Set<MilestoneKey>): void {
    try {
      localStorage.setItem(this.CHECKLIST_KEY, JSON.stringify([...state]));
    } catch (error) {
      console.error('Error saving checklist state to localStorage:', error);
    }
  }
}
