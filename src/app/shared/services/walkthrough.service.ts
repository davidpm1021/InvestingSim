import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WALKTHROUGH_STEPS, WalkthroughStep } from '../data/walkthrough-steps';

/**
 * Drives the guided walkthrough. Each step has two states:
 *   - EXPANDED: a full-screen "learning moment" pop-up the student reads.
 *   - MINIMIZED: a small docked coach bar, so the student can actually use the
 *     app to do what the step asked, then click "Next step" to proceed.
 * Active state, current step, and expanded/minimized all persist to localStorage
 * so a refresh resumes in place; a finished/skipped guide stays closed.
 */
@Injectable({ providedIn: 'root' })
export class WalkthroughService {
  private readonly STEP_KEY = 'investing_sim__walkthrough_step';
  private readonly DONE_KEY = 'investing_sim__walkthrough_done';
  private readonly EXPANDED_KEY = 'investing_sim__walkthrough_expanded';

  readonly steps: WalkthroughStep[] = WALKTHROUGH_STEPS;

  private indexSubject = new BehaviorSubject<number>(this.loadStep());
  private activeSubject = new BehaviorSubject<boolean>(false);
  // Default to expanded; only minimized if the student explicitly minimized before.
  private expandedSubject = new BehaviorSubject<boolean>(localStorage.getItem(this.EXPANDED_KEY) !== '0');

  readonly active$ = this.activeSubject.asObservable();
  readonly expanded$ = this.expandedSubject.asObservable();
  readonly index$ = this.indexSubject.asObservable();

  get index(): number { return this.indexSubject.value; }
  get total(): number { return this.steps.length; }
  get current(): WalkthroughStep { return this.steps[this.index]; }
  get isFirst(): boolean { return this.index === 0; }
  get isLast(): boolean { return this.index >= this.steps.length - 1; }
  get done(): boolean { return localStorage.getItem(this.DONE_KEY) === '1'; }

  /** Show the guide on first visit (skipped once finished). */
  autoStart(): void {
    if (!this.done) { this.activeSubject.next(true); }
  }

  /** Restart from the top (for a "replay the guide" control). */
  start(): void {
    this.setIndex(0);
    localStorage.removeItem(this.DONE_KEY);
    this.setExpanded(true);
    this.activeSubject.next(true);
  }

  /** Collapse the current step to the coach bar so the student can try it. */
  minimize(): void { this.setExpanded(false); }
  /** Re-open the current step's full pop-up. */
  expand(): void { this.setExpanded(true); }

  /** Proceed to the next step (re-opens its pop-up), or finish on the last one. */
  next(): void {
    if (this.isLast) { this.finish(); return; }
    this.setIndex(this.index + 1);
    this.setExpanded(true);
  }

  prev(): void {
    if (this.index > 0) {
      this.setIndex(this.index - 1);
      this.setExpanded(true);
    }
  }

  finish(): void {
    localStorage.setItem(this.DONE_KEY, '1');
    this.setExpanded(true); // reset so a future replay starts expanded
    this.activeSubject.next(false);
  }

  private setIndex(i: number): void {
    this.indexSubject.next(i);
    localStorage.setItem(this.STEP_KEY, String(i));
  }

  private setExpanded(e: boolean): void {
    this.expandedSubject.next(e);
    localStorage.setItem(this.EXPANDED_KEY, e ? '1' : '0');
  }

  private loadStep(): number {
    const s = parseInt(localStorage.getItem(this.STEP_KEY) || '0', 10);
    return Number.isNaN(s) || s < 0 || s >= WALKTHROUGH_STEPS.length ? 0 : s;
  }
}
