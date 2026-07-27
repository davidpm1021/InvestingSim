import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { filter, skip, distinctUntilChanged } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';
import { WALKTHROUGH_STEPS, WalkthroughStep } from '../data/walkthrough-steps';
import { OnboardingService } from './onboarding.service';
import { CurrentDateService } from './current-date.service';
import { ChecklistService } from './checklist.service';
import { SIM_YEAR_START } from '../data/quarters.data';

/**
 * Split any step that carries questions into two runtime steps: the instruction
 * itself, then a follow-up "Check yourself" question screen. Keeps authoring
 * compact (questions live next to their instruction) while the student sees the
 * question as its own step, reached by clicking Next.
 */
function expandSteps(source: WalkthroughStep[]): WalkthroughStep[] {
  const out: WalkthroughStep[] = [];
  for (const step of source) {
    if (step.questions?.length) {
      const instruction: WalkthroughStep = { ...step };
      delete instruction.questions;
      out.push(instruction);
      out.push({
        part: step.part, title: 'Check yourself', body: [], kind: 'question',
        questions: step.questions,
      });
    } else {
      out.push({ ...step });
    }
  }
  return out;
}

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

  readonly steps: WalkthroughStep[] = expandSteps(WALKTHROUGH_STEPS);

  private indexSubject = new BehaviorSubject<number>(this.loadStep());
  private activeSubject = new BehaviorSubject<boolean>(false);
  // A step always arrives maximized; minimizing is session-only and does not
  // persist, so advancing to (or reloading on) any step shows its pop-up first.
  private expandedSubject = new BehaviorSubject<boolean>(true);

  readonly active$ = this.activeSubject.asObservable();
  readonly expanded$ = this.expandedSubject.asObservable();
  readonly index$ = this.indexSubject.asObservable();

  constructor(
    private router: Router,
    private onboarding: OnboardingService,
    private currentDate: CurrentDateService,
    private checklist: ChecklistService,
  ) {
    // Auto-advance, but ONLY for steps with one obvious completion event, and
    // only while the student is minimized on that step (actively doing it).
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(e => {
      const url = (e as NavigationEnd).urlAfterRedirects;
      if (url.startsWith('/investing') || url.startsWith('/banking')) {
        this.autoAdvance('browser-open');
      }
    });
    this.onboarding.bankLinked$.pipe(skip(1), distinctUntilChanged(), filter(v => v))
      .subscribe(() => this.autoAdvance('bank-linked'));
    this.onboarding.hasFunded$.pipe(skip(1), distinctUntilChanged(), filter(v => v))
      .subscribe(() => this.autoAdvance('funded'));
    this.currentDate.currentDate$.pipe(skip(1), distinctUntilChanged())
      .subscribe(() => this.autoAdvance('quarter-advanced'));
    // Gate steps advance when their checklist milestone (buy/sell/statement/
    // withdraw) is reached while the student is minimized on that step.
    this.checklist.completed$.subscribe(() => this.autoAdvanceGate());
  }

  get index(): number { return this.indexSubject.value; }
  get total(): number { return this.steps.length; }
  get current(): WalkthroughStep { return this.steps[this.index]; }
  get isFirst(): boolean { return this.index === 0; }
  get isLast(): boolean { return this.index >= this.steps.length - 1; }
  get done(): boolean { return localStorage.getItem(this.DONE_KEY) === '1'; }
  get active(): boolean { return this.activeSubject.value; }
  get expanded(): boolean { return this.expandedSubject.value; }

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

  /**
   * Skip just the page tour: jump past the contiguous spotlight steps to the
   * next real task, instead of ending the whole guide. Finishes only if the
   * tour is the very last thing left.
   */
  skipTour(): void {
    let i = this.index;
    while (i < this.steps.length && this.steps[i].target) { i++; }
    if (i >= this.steps.length) { this.finish(); return; }
    this.setIndex(i);
    this.setExpanded(true);
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
  }

  /** Advance only if the guide is minimized on the step this trigger belongs to. */
  private autoAdvance(trigger: string): void {
    if (this.activeSubject.value && !this.expandedSubject.value && this.current.trigger === trigger) {
      this.next();
    }
  }

  /** Advance when the current gate step's milestone is done (and we're minimized). */
  private autoAdvanceGate(): void {
    const g = this.current.gate;
    if (g && this.activeSubject.value && !this.expandedSubject.value && this.checklist.isDone(g)) {
      this.next();
    }
  }

  /**
   * Whether the student may advance from the current step. Gated steps
   * (requireAction or gate) return false until their condition is met — but
   * true if it was already satisfied before the student arrived, so an early
   * action never leaves them stuck on a disabled button.
   */
  canProceed(): boolean {
    const s = this.current;
    if (s.gate) { return this.checklist.isDone(s.gate); }
    if (!s.requireAction) { return true; }
    switch (s.trigger) {
      case 'browser-open': {
        const u = this.router.url;
        return u.startsWith('/investing') || u.startsWith('/banking');
      }
      case 'bank-linked': return this.onboarding.bankLinked;
      case 'funded': return this.onboarding.hasFunded;
      case 'quarter-advanced': return this.currentDate.getCurrentDate() !== SIM_YEAR_START;
      default: return true;
    }
  }

  private loadStep(): number {
    const s = parseInt(localStorage.getItem(this.STEP_KEY) || '0', 10);
    return Number.isNaN(s) || s < 0 || s >= this.steps.length ? 0 : s;
  }
}
