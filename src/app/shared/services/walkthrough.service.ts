import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WALKTHROUGH_STEPS, WalkthroughStep } from '../data/walkthrough-steps';

/**
 * Drives the guided walkthrough: which learning moment is showing, whether it is
 * active (auto-starts for a first-time student) and whether it is paused (the
 * student chose to explore on their own). Progress persists to localStorage so a
 * refresh resumes where they left off, and a finished/skipped guide stays closed.
 */
@Injectable({ providedIn: 'root' })
export class WalkthroughService {
  private readonly STEP_KEY = 'investing_sim__walkthrough_step';
  private readonly DONE_KEY = 'investing_sim__walkthrough_done';
  private readonly PAUSED_KEY = 'investing_sim__walkthrough_paused';

  readonly steps: WalkthroughStep[] = WALKTHROUGH_STEPS;

  private indexSubject = new BehaviorSubject<number>(this.loadStep());
  private activeSubject = new BehaviorSubject<boolean>(false);
  private pausedSubject = new BehaviorSubject<boolean>(localStorage.getItem(this.PAUSED_KEY) === '1');

  readonly active$ = this.activeSubject.asObservable();
  readonly paused$ = this.pausedSubject.asObservable();
  readonly index$ = this.indexSubject.asObservable();

  get index(): number { return this.indexSubject.value; }
  get total(): number { return this.steps.length; }
  get current(): WalkthroughStep { return this.steps[this.index]; }
  get isLast(): boolean { return this.index >= this.steps.length - 1; }
  get done(): boolean { return localStorage.getItem(this.DONE_KEY) === '1'; }

  /** Show the guide on load for a first-time student (skipped if finished). */
  autoStart(): void {
    if (!this.done) {
      this.activeSubject.next(true);
    }
  }

  /** Restart from the beginning (used by a "replay the guide" control). */
  start(): void {
    this.setIndex(0);
    localStorage.removeItem(this.DONE_KEY);
    this.setPaused(false);
    this.activeSubject.next(true);
  }

  next(): void {
    if (this.isLast) { this.finish(); return; }
    this.setIndex(this.index + 1);
  }

  prev(): void {
    if (this.index > 0) { this.setIndex(this.index - 1); }
  }

  pause(): void { this.setPaused(true); }
  resume(): void { this.setPaused(false); }

  finish(): void {
    localStorage.setItem(this.DONE_KEY, '1');
    this.setPaused(false);
    this.activeSubject.next(false);
  }

  private setIndex(i: number): void {
    this.indexSubject.next(i);
    localStorage.setItem(this.STEP_KEY, String(i));
  }

  private setPaused(p: boolean): void {
    this.pausedSubject.next(p);
    localStorage.setItem(this.PAUSED_KEY, p ? '1' : '0');
  }

  private loadStep(): number {
    const s = parseInt(localStorage.getItem(this.STEP_KEY) || '0', 10);
    return Number.isNaN(s) || s < 0 || s >= WALKTHROUGH_STEPS.length ? 0 : s;
  }
}
