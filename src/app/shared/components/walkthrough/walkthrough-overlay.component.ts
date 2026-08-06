import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { A11yModule } from '@angular/cdk/a11y';
import { Router } from '@angular/router';
import { DefineComponent } from '../define/define.component';
import { Subscription, combineLatest } from 'rxjs';
import { WalkthroughService } from '../../services/walkthrough.service';
import { ResponsesService } from '../../services/responses.service';
import { ChecklistService, MILESTONES } from '../../services/checklist.service';
import { CfuQuestion } from '../../data/walkthrough-steps';
import { GLOSSARY } from '../../data/glossary';

interface Rect { top: number; left: number; width: number; height: number; }
interface Segment { t: string; def: string | null; }

/**
 * The guided walkthrough UI, with three presentations:
 *   - TOUR step (has a `target` selector): spotlights that element on the page
 *     and anchors a small callout to it (Back / Next). Used for the page tour.
 *   - LEARNING moment (no target): a centered pop-up; minimizes to a coach bar
 *     so the student can do the action, then proceeds.
 *   - MINIMIZED: the docked coach bar.
 */
@Component({
  selector: 'app-walkthrough-overlay',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, A11yModule, DefineComponent],
  template: `
    <ng-container *ngIf="(svc.active$ | async) && !onSplash">

      <!-- ===== TOUR: spotlight + anchored callout ===== -->
      <ng-container *ngIf="(svc.expanded$ | async) && svc.current.target">
        <div class="wt-block"></div>
        <div class="wt-spot" *ngIf="spotRect"
             [style.top.px]="spotRect.top - 6" [style.left.px]="spotRect.left - 6"
             [style.width.px]="spotRect.width + 12" [style.height.px]="spotRect.height + 12"></div>
        <div class="wt-callout" [ngStyle]="calloutStyle" role="dialog" aria-modal="true"
             cdkTrapFocus [cdkTrapFocusAutoCapture]="true" (keydown.escape)="svc.minimize()"
             [attr.aria-label]="svc.current.title">
          <button class="wt-close" type="button" (click)="svc.minimize()"
                  aria-label="Minimize so you can look around">
            <mat-icon fontIcon="la-minus"></mat-icon>
          </button>
          <div class="wt-meta">
            <span class="wt-chip">{{ svc.current.part }}</span>
          </div>
          <h3 class="wt-ct-title">{{ svc.current.title }}</h3>
          <p class="wt-ct-body" *ngFor="let segs of bodySegments"><ng-container *ngFor="let seg of segs"><app-define *ngIf="seg.def" [def]="seg.def" [label]="seg.t"></app-define><span *ngIf="!seg.def">{{ seg.t }}</span></ng-container></p>
          <p class="wt-note" *ngIf="svc.current.note">{{ svc.current.note }}</p>
          <div class="wt-actions">
            <button mat-button type="button" class="wt-skip" (click)="svc.skipTour()">Skip tour</button>
            <span class="wt-spacer"></span>
            <button mat-button type="button" *ngIf="!svc.isFirst && !svc.current.sealBack" (click)="svc.prev()">Back</button>
            <button mat-raised-button color="primary" type="button" cdkFocusInitial (click)="svc.next()">Next</button>
          </div>
        </div>
      </ng-container>

      <!-- ===== LEARNING moment: centered pop-up ===== -->
      <div class="wt-scrim" *ngIf="(svc.expanded$ | async) && !svc.current.target"
           role="dialog" aria-modal="true" [attr.aria-label]="svc.current.title">
        <div class="wt-card" [class.wt-card--quiz]="svc.current.kind === 'question'"
             cdkTrapFocus [cdkTrapFocusAutoCapture]="true"
             (keydown.escape)="svc.minimize()">
          <button class="wt-close" type="button" (click)="svc.minimize()"
                  aria-label="Minimize so you can try it">
            <mat-icon fontIcon="la-minus"></mat-icon>
          </button>
          <div class="wt-meta">
            <span class="wt-chip">{{ svc.current.part }}</span>
          </div>
          <!-- ===== QUESTION screen: its own step, notebook / paper look ===== -->
          <ng-container *ngIf="svc.current.kind === 'question'; else instruction">
            <div class="wt-cfu-head">
              <mat-icon aria-hidden="true" fontIcon="la-pen"></mat-icon>
              <span>Check yourself</span>
            </div>
            <div class="wt-cfu" *ngFor="let q of svc.current.questions">
              <fieldset class="wt-cfu-mc" *ngIf="q.kind === 'mc'" [disabled]="isChecked(q)">
                <legend class="wt-cfu-q">{{ q.prompt }}</legend>
                <label class="wt-choice" *ngFor="let opt of shuffledChoices(q)"
                       [class.selected]="isSelected(q, opt.i)"
                       [class.correct]="isChecked(q) && opt.c.correct"
                       [class.wrong]="isChecked(q) && isSelected(q, opt.i) && !opt.c.correct">
                  <input type="radio" [name]="q.id" [checked]="isSelected(q, opt.i)" (change)="selectChoice(q, opt.i)">
                  <span class="wt-choice-text">{{ opt.c.text }}</span>
                  <mat-icon class="wt-choice-mark" *ngIf="isChecked(q) && opt.c.correct" fontIcon="la-check"></mat-icon>
                  <mat-icon class="wt-choice-mark" *ngIf="isChecked(q) && isSelected(q, opt.i) && !opt.c.correct" fontIcon="la-times"></mat-icon>
                </label>
                <p class="wt-cfu-exp" *ngIf="isChecked(q)" [class.right]="isSelectedCorrect(q)">
                  <strong>{{ isSelectedCorrect(q) ? 'Correct.' : 'Not quite.' }}</strong> {{ q.explanation }}
                </p>
              </fieldset>
              <div class="wt-cfu-free" *ngIf="q.kind === 'free'">
                <label class="wt-cfu-q" [attr.for]="q.id">{{ q.prompt }}</label>
                <textarea [id]="q.id" class="wt-cfu-text" rows="4" [value]="textFor(q)"
                          (input)="saveText(q, $event)" placeholder="Type your answer..."></textarea>
              </div>
            </div>
            <div class="wt-progress-wrap"
                 [attr.aria-label]="milestonesDone + ' of ' + milestonesTotal + ' notebook steps done'">
              <mat-icon class="wt-progress-icon" aria-hidden="true" fontIcon="la-book-open"></mat-icon>
              <div class="wt-progress"><span class="wt-bar" [style.width.%]="milestonePct"></span></div>
              <span class="wt-progress-label">{{ milestonesDone }} / {{ milestonesTotal }}</span>
            </div>
            <div class="wt-actions">
              <button mat-button type="button" *ngIf="!svc.isFirst && !svc.current.sealBack" (click)="svc.prev()">Back</button>
              <span class="wt-spacer"></span>
              <button *ngIf="needsCheck()" mat-raised-button color="primary" type="button"
                      cdkFocusInitial [disabled]="!canCheck()"
                      [attr.title]="!canCheck() ? 'Pick an answer first' : null"
                      (click)="checkAnswers()">{{ checkLabel }}</button>
              <button *ngIf="!needsCheck()" mat-raised-button color="primary" type="button"
                      cdkFocusInitial (click)="svc.next()">
                {{ svc.isLast ? 'Finish' : 'Continue' }}
              </button>
            </div>
          </ng-container>

          <!-- ===== INSTRUCTION screen ===== -->
          <ng-template #instruction>
            <h2 class="wt-title">{{ svc.current.title }}</h2>
            <p class="wt-body" *ngFor="let segs of bodySegments"><ng-container *ngFor="let seg of segs"><app-define *ngIf="seg.def" [def]="seg.def" [label]="seg.t"></app-define><span *ngIf="!seg.def">{{ seg.t }}</span></ng-container></p>
            <div class="wt-action" *ngIf="svc.current.action">
              <mat-icon fontIcon="la-hand-pointer"></mat-icon>
              <span>{{ svc.current.action }}</span>
            </div>
            <p class="wt-note" *ngIf="svc.current.note">{{ svc.current.note }}</p>
            <div class="wt-progress-wrap"
                 [attr.aria-label]="milestonesDone + ' of ' + milestonesTotal + ' notebook steps done'">
              <mat-icon class="wt-progress-icon" aria-hidden="true" fontIcon="la-book-open"></mat-icon>
              <div class="wt-progress"><span class="wt-bar" [style.width.%]="milestonePct"></span></div>
              <span class="wt-progress-label">{{ milestonesDone }} / {{ milestonesTotal }}</span>
            </div>
            <div class="wt-actions">
              <button mat-button type="button" *ngIf="!svc.isFirst && !svc.current.sealBack" (click)="svc.prev()">Back</button>
              <span class="wt-spacer"></span>
              <button mat-raised-button color="primary" type="button" cdkFocusInitial (click)="primary()">{{ primaryLabel }}</button>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- ===== MINIMIZED: coach bar (click anywhere on the bar to expand) ===== -->
      <div class="wt-coach" *ngIf="!(svc.expanded$ | async)" (click)="svc.expand()">
        <!-- Real button so the step is re-openable by keyboard, not just mouse. -->
        <button type="button" class="wt-coach-text" (click)="svc.expand()" aria-label="Open the current step">
          <span class="wt-chip sm">{{ svc.current.part }}</span>
          <span class="wt-coach-action">{{ svc.current.action || svc.current.title }}</span>
        </button>
        <div class="wt-coach-actions">
          <button mat-button type="button" *ngIf="!svc.isFirst && !svc.current.sealBack" (click)="svc.prev(); $event.stopPropagation()">Back</button>
          <button mat-raised-button color="primary" type="button"
                  [disabled]="!svc.canProceed()"
                  [attr.title]="!svc.canProceed() ? 'Do the step to continue' : null"
                  (click)="svc.next(); $event.stopPropagation()">
            {{ svc.isLast ? 'Finish' : 'Next step' }}
          </button>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    .wt-scrim {
      position: fixed; inset: 0; z-index: 3000;
      display: flex; align-items: center; justify-content: center; padding: 24px;
      background: rgba(6, 11, 36, 0.74); backdrop-filter: blur(2px);
      animation: wt-fade 0.2s ease;
    }
    @keyframes wt-fade { from { opacity: 0; } to { opacity: 1; } }

    .wt-card {
      position: relative; width: 100%; max-width: 560px; max-height: 88vh; overflow-y: auto;
      background: #ffffff; color: #41496b; border-radius: 16px; box-shadow: 0 34px 90px rgba(6, 11, 36, 0.4);
      padding: 28px 28px 20px; font-family: 'Montserrat', sans-serif;
      animation: wt-pop 0.25s cubic-bezier(0.2, 0.7, 0.3, 1);
    }
    @keyframes wt-pop { from { transform: scale(0.95) translateY(10px); opacity: 0; } to { transform: none; opacity: 1; } }

    .wt-close {
      position: absolute; top: 12px; right: 12px; border: none; border-radius: 50%;
      background: rgba(11, 21, 65, 0.06); color: #5f6d92; cursor: pointer;
      width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; line-height: 1;
    }
    .wt-close mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .wt-close:hover { background: rgba(11, 21, 65, 0.12); color: #0d1157; }

    .wt-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .wt-chip {
      background: #36ebff; color: #06122a; font-size: 0.72rem; font-weight: 800;
      letter-spacing: 0.5px; text-transform: uppercase; padding: 5px 11px; border-radius: 6px; white-space: nowrap;
    }
    .wt-chip.sm { font-size: 0.66rem; padding: 3px 8px; flex-shrink: 0; white-space: nowrap; }

    .wt-title { margin: 0 0 12px; font-size: 1.5rem; font-weight: 700; color: #0d1157; }
    .wt-body { margin: 0 0 12px; font-size: 0.98rem; line-height: 1.55; color: #41496b; }

    .wt-action {
      display: flex; align-items: flex-start; gap: 10px; margin: 16px 0 8px;
      padding: 12px 14px; background: #e7f8f0;
      border-radius: 9px; font-size: 0.92rem; font-weight: 600; color: #12513a;
    }
    .wt-action mat-icon { color: #0a9d67; flex-shrink: 0; }

    /* Housekeeping aside about the simulation: present, but out of the way of the
       teaching copy. */
    .wt-note { margin: 10px 0 0; font-size: 0.78rem; line-height: 1.4; color: #7b849e; }

    .wt-progress-wrap { display: flex; align-items: center; gap: 8px; margin: 18px 0 14px; }
    .wt-progress-wrap .wt-progress { flex: 1; margin: 0; }
    .wt-progress-icon { color: #275ce4; font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; overflow: visible; }
    .wt-progress-label { font-size: 0.78rem; font-weight: 600; color: #5f6d92; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .wt-progress { height: 8px; background: rgba(11, 21, 65, 0.10); border-radius: 999px; margin: 18px 0 14px; overflow: hidden; }
    .wt-bar { display: block; height: 100%; background: linear-gradient(90deg, #275ce4, #36ebff); border-radius: 999px; transition: width 0.3s ease; }

    /* ---------- check-for-understanding: its own step ---------- */
    .wt-card--quiz {
      background: #f6f8fd; border: 1px solid #e1e7f4;
      box-shadow: 0 34px 90px rgba(6, 11, 36, 0.4);
    }
    .wt-cfu-head {
      display: flex; align-items: center; gap: 8px; margin: 4px 0 14px;
      font-family: 'Montserrat', Helvetica, Arial, sans-serif; font-weight: 700;
      font-size: 1.3rem; line-height: 1; color: #0e8fa8;
    }
    .wt-cfu-head mat-icon { color: #275ce4; font-size: 24px; width: 24px; height: 24px; }
    .wt-cfu + .wt-cfu { margin-top: 18px; padding-top: 16px; border-top: 1px dashed #d6def0; }
    .wt-cfu-mc { border: none; margin: 0; padding: 0; min-width: 0; }
    .wt-cfu-q { font-size: 0.98rem; font-weight: 700; color: #0d1157; padding: 0; margin: 0 0 10px; line-height: 1.4; }
    .wt-choice {
      display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; margin-bottom: 8px;
      background: #ffffff; border: 1.5px solid #d6def0; border-radius: 10px; cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease;
    }
    .wt-choice:hover { background: #eef3fb; }
    .wt-choice:focus-within { outline: 2px solid #275ce4; outline-offset: 2px; }
    .wt-choice input { margin: 2px 0 0; flex-shrink: 0; width: 16px; height: 16px; accent-color: #275ce4; }
    .wt-choice-text { flex: 1; font-size: 0.92rem; line-height: 1.45; color: #2a3554; }
    .wt-choice-mark { flex-shrink: 0; font-size: 20px; width: 20px; height: 20px; }
    .wt-choice.selected { border-color: #275ce4; }
    .wt-choice.correct { border-color: #0a9d67; background: #e7f8f0; }
    .wt-choice.correct .wt-choice-mark { color: #0a9d67; }
    .wt-choice.wrong { border-color: #e0616a; background: #fdecec; }
    .wt-choice.wrong .wt-choice-mark { color: #d64550; }
    .wt-cfu-exp {
      margin: 4px 2px 0; font-size: 0.88rem; line-height: 1.5; color: #41496b;
      background: #eef3fb; border-radius: 9px; padding: 10px 12px;
    }
    .wt-cfu-exp.right { background: #e7f8f0; }
    .wt-cfu-exp strong { color: #0d1157; }
    .wt-cfu-free { display: flex; flex-direction: column; gap: 8px; }
    .wt-cfu-text {
      width: 100%; box-sizing: border-box; resize: vertical; min-height: 84px;
      background: #ffffff; border: 1.5px solid #d6def0; border-radius: 10px; padding: 10px 12px;
      font-family: 'Montserrat', sans-serif; font-size: 0.92rem; line-height: 1.5; color: #1c2740;
    }
    .wt-cfu-text::placeholder { color: #8a97b8; }
    .wt-cfu-text:focus { outline: none; border-color: #275ce4; box-shadow: 0 0 0 3px rgba(39, 92, 228, 0.18); }

    .wt-actions { display: flex; align-items: center; gap: 8px; }
    .wt-spacer { flex: 1; }
    /* Text buttons (Back) -> blue on the light modal. */
    .wt-actions .mat-mdc-button:not(.wt-skip),
    .wt-actions .mat-mdc-button:not(.wt-skip) .mdc-button__label { color: #275ce4 !important; }
    .wt-skip, .wt-skip .mdc-button__label { color: #5f6d92 !important; }

    /* ---------- tour spotlight ---------- */
    .wt-block { position: fixed; inset: 0; z-index: 3000; background: transparent; }
    /* The 9999px box-shadow IS the page dimmer, so fading this element in fades the
       whole scrim up instead of snapping the page dark in a single frame. */
    .wt-spot {
      position: fixed; z-index: 3001; pointer-events: none;
      border: 2px solid #36ebff; border-radius: 10px;
      box-shadow: 0 0 0 9999px rgba(6, 11, 36, 0.7);
      animation: wt-fade 0.45s ease-out;
      transition: top 0.3s cubic-bezier(0.3, 0.7, 0.3, 1), left 0.3s cubic-bezier(0.3, 0.7, 0.3, 1),
                  width 0.3s cubic-bezier(0.3, 0.7, 0.3, 1), height 0.3s cubic-bezier(0.3, 0.7, 0.3, 1);
    }
    /* Comes in just after the dim has started, so the two do not land at once. */
    .wt-callout {
      position: fixed; z-index: 3002; box-sizing: border-box;
      background: #ffffff; color: #41496b; border-radius: 14px; box-shadow: 0 20px 50px rgba(6, 11, 36, 0.4);
      padding: 16px 18px 12px; font-family: 'Montserrat', sans-serif;
      animation: wt-callout-in 0.4s cubic-bezier(0.2, 0.7, 0.3, 1) 0.15s both;
      transition: top 0.3s cubic-bezier(0.3, 0.7, 0.3, 1), left 0.3s cubic-bezier(0.3, 0.7, 0.3, 1);
    }
    @keyframes wt-fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes wt-callout-in {
      from { opacity: 0; transform: translateY(8px) scale(0.98); }
      to { opacity: 1; transform: none; }
    }
    .wt-ct-title { margin: 0 0 6px; font-size: 1.1rem; font-weight: 700; color: #0d1157; }
    .wt-ct-body { margin: 0 0 8px; font-size: 0.9rem; line-height: 1.5; color: #41496b; }

    /* ---------- minimized coach bar ---------- */
    .wt-coach {
      position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%);
      z-index: 2500; display: flex; align-items: center; gap: 14px;
      width: min(900px, calc(100vw - 32px));
      padding: 12px 14px 12px 22px; background: #ffffff; color: #2a3554; border: 1px solid #e1e7f4;
      border-radius: 999px; box-shadow: 0 20px 50px rgba(6, 11, 36, 0.32);
      font-family: 'Montserrat', sans-serif; animation: wt-rise 0.2s ease; cursor: pointer;
    }
    @keyframes wt-rise { from { transform: translate(-50%, 12px); opacity: 0; } to { transform: translateX(-50%); opacity: 1; } }
    .wt-coach-text {
      flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px;
      border: none; background: transparent; padding: 4px; margin: -4px; cursor: pointer;
      font: inherit; color: inherit; text-align: left; border-radius: 8px;
    }
    .wt-coach-text:focus-visible { outline: 2px solid #275ce4; outline-offset: 2px; }
    /* Wraps rather than truncating: the step's instruction is the whole point of
       the coach bar, so it must be readable in full while the guide is minimized. */
    .wt-coach-action { font-size: 0.9rem; font-weight: 600; color: #2a3554; line-height: 1.4; }
    .wt-coach-actions { flex-shrink: 0; display: flex; align-items: center; gap: 4px; }
    .wt-coach-actions .mat-mdc-raised-button { border-radius: 999px; }
    @media (max-width: 600px) { .wt-coach-action { font-size: 0.82rem; } }

    /* Keep the guide usable without the motion: the spotlight still needs its dim,
       so only the movement and entrance timing are dropped. */
    @media (prefers-reduced-motion: reduce) {
      .wt-card, .wt-coach, .wt-spot, .wt-callout { animation: none; }
      .wt-spot, .wt-callout { transition: none; }
    }
  `]
})
export class WalkthroughOverlayComponent implements OnInit, OnDestroy {
  spotRect: Rect | null = null;
  // The current step's body, pre-split so glossary terms render with hover definitions.
  bodySegments: Segment[][] = [];
  private calloutHeight = 0; // measured height of the tour callout, for on-screen clamping
  private sub = new Subscription();
  private readonly onScroll = () => this.measure();
  private readonly onResize = () => this.measure();

  // Terms to auto-define in the copy, most specific first (so "bond fund" wins over the
  // bare "fund", and the verb in "Add Funds" is skipped via the lookbehind).
  private readonly termRe = /(capital gains tax|cash settlement accounts?|quarterly statements?|target-date funds?|bond funds?|mutual funds?|index funds?|\bETFs?\b|\bstocks?\b|(?<!add )(?<!withdraw )\bfunds?\b|\bdividends?\b|\binterest\b|\bdiversification\b|\bbrokerage(?: account)?\b|\bsettlement\b|\bcompounding\b|\bvolatility\b)/gi;

  constructor(
    public svc: WalkthroughService,
    private responses: ResponsesService,
    private checklist: ChecklistService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  /** The welcome splash ('/') is a pre-sim landing; the guide only appears once
   *  the student enters the sim, so the overlay is hidden there even while active. */
  get onSplash(): boolean {
    return this.router.url.split('?')[0] === '/';
  }

  // Stable shuffled display order per question, so the correct answer is not
  // always the first choice. Keyed by question id; `i` is the ORIGINAL index
  // (what ResponsesService stores and what correctness checks use).
  private shuffleCache = new Map<string, { c: { text: string; correct?: boolean }; i: number }[]>();

  shuffledChoices(q: CfuQuestion): { c: { text: string; correct?: boolean }; i: number }[] {
    const cached = this.shuffleCache.get(q.id);
    if (cached) { return cached; }
    const items = (q.choices || []).map((c, i) => ({ c, i }));
    for (let k = items.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [items[k], items[j]] = [items[j], items[k]];
    }
    this.shuffleCache.set(q.id, items);
    return items;
  }

  // ----- Check-for-understanding question state (persisted via ResponsesService) -----
  // Questions the student has SUBMITTED for checking this session. Selecting a choice
  // no longer reveals the answer; feedback waits until they press "Check answer". The
  // set is guarded by isAnswered() in isChecked(), so a guide replay (which clears the
  // saved responses) also clears the revealed state without extra bookkeeping.
  private checked = new Set<string>();

  isSelected(q: CfuQuestion, i: number): boolean {
    return this.responses.get(q.id)?.choiceIndex === i;
  }
  isAnswered(q: CfuQuestion): boolean {
    return this.responses.get(q.id)?.choiceIndex !== undefined;
  }
  isSelectedCorrect(q: CfuQuestion): boolean {
    const i = this.responses.get(q.id)?.choiceIndex;
    return i !== undefined && !!q.choices?.[i]?.correct;
  }
  selectChoice(q: CfuQuestion, i: number): void {
    this.responses.setChoice(q.id, i);
  }

  /** The multiple-choice questions on the current screen (free-text ones never gate). */
  private mcQuestions(): CfuQuestion[] {
    return (this.svc.current?.questions || []).filter(q => q.kind === 'mc');
  }
  /** True once the student has submitted this question and its feedback is revealed. */
  isChecked(q: CfuQuestion): boolean {
    return this.checked.has(q.id) && this.isAnswered(q);
  }
  /** Show the "Check answer" button while any MC question is still unrevealed. */
  needsCheck(): boolean {
    return this.mcQuestions().some(q => !this.isChecked(q));
  }
  /** Enable "Check answer" only once every MC question has a selection. */
  canCheck(): boolean {
    const mc = this.mcQuestions();
    return mc.length > 0 && mc.every(q => this.isAnswered(q));
  }
  checkAnswers(): void {
    this.mcQuestions().forEach(q => this.checked.add(q.id));
    this.cdr.detectChanges();
  }
  get checkLabel(): string {
    return this.mcQuestions().length > 1 ? 'Check answers' : 'Check answer';
  }
  textFor(q: CfuQuestion): string {
    return this.responses.get(q.id)?.text ?? '';
  }
  saveText(q: CfuQuestion, ev: Event): void {
    this.responses.setText(q.id, (ev.target as HTMLTextAreaElement).value);
  }

  ngOnInit(): void {
    window.addEventListener('scroll', this.onScroll, true); // capture: catch inner scroll
    window.addEventListener('resize', this.onResize);
    this.sub.add(this.checklist.completed$.subscribe(set => {
      this.milestonesDone = set.size;
      this.cdr.detectChanges();
    }));
    this.sub.add(
      combineLatest([this.svc.active$, this.svc.index$, this.svc.expanded$])
        .subscribe(() => {
          // Define each distinct glossary term only once per step (first occurrence);
          // repeats render as plain text so the same word isn't underlined twice.
          const seen = new Set<string>();
          this.bodySegments = (this.svc.current?.body || []).map(
            p => this.svc.current?.noGlossary ? [{ t: p, def: null }] : this.defineSegments(p, seen)
          );
          // The coach bar is a fixed bottom overlay; flag it so the page can pad
          // its scroll area and content never hides behind the bar.
          document.body.classList.toggle('wt-coach-open', this.svc.active && !this.svc.expanded);
          this.refreshTarget();
        })
    );
  }

  /** Split a paragraph into plain text and glossary-term segments (term carries its
   *  definition). `seen` holds the definitions already surfaced earlier in this step, so a
   *  term (or a synonym sharing its definition) is only linked on its first appearance. */
  private defineSegments(text: string, seen: Set<string>): Segment[] {
    const out: Segment[] = [];
    let last = 0;
    this.termRe.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = this.termRe.exec(text)) !== null) {
      if (m.index > last) { out.push({ t: text.slice(last, m.index), def: null }); }
      const def = this.defFor(m[0]);
      if (def && !seen.has(def)) {
        seen.add(def);
        out.push({ t: m[0], def });
      } else {
        out.push({ t: m[0], def: null });
      }
      last = m.index + m[0].length;
    }
    if (last < text.length) { out.push({ t: text.slice(last), def: null }); }
    return out;
  }

  /** Glossary definition for a matched term (null if unknown). */
  private defFor(matched: string): string | null {
    const m = matched.toLowerCase();
    const key =
      m.includes('capital gains tax') ? 'Capital gains tax' :
      m.includes('quarterly statement') ? 'Quarterly statement' :
      m.includes('target-date fund') ? 'Target-date fund' :
      m.includes('bond fund') ? 'Bond fund' :
      m.includes('mutual fund') ? 'Mutual fund' :
      m.includes('index fund') ? 'Index fund' :
      m.startsWith('etf') ? 'ETF' :
      m.startsWith('stock') ? 'Stock' :
      m.startsWith('fund') ? 'Fund' :
      m.startsWith('dividend') ? 'Dividend' :
      m.startsWith('interest') ? 'Interest' :
      m.startsWith('diversification') ? 'Diversification' :
      m.startsWith('brokerage') ? 'Brokerage account' :
      m.includes('settlement') ? 'Cash Settlement Account' :
      m.startsWith('compounding') ? 'Compounding' :
      m.startsWith('volatility') ? 'Volatility' : '';
    return key ? (GLOSSARY[key] || null) : null;
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll, true);
    window.removeEventListener('resize', this.onResize);
    document.body.classList.remove('wt-coach-open');
    this.sub.unsubscribe();
  }

  // The tutorial-box progress tracks the seven notebook milestones (the real
  // actions the student completes), not the raw step index, so "progress" means
  // tasks actually done and it stays in step with the notebook checklist.
  readonly milestonesTotal = MILESTONES.length;
  milestonesDone = 0;
  get milestonePct(): number {
    return this.milestonesTotal ? (this.milestonesDone / this.milestonesTotal) * 100 : 0;
  }

  /**
   * A step that asks the student to DO something (it carries an `action`) has to
   * step aside so the page is reachable, so its primary button minimizes to the
   * coach bar ("Got it, let me try"). Steps with nothing to do skip straight to
   * the question with "Next". Keying on the action rather than on gating means
   * even an optional look-around step like "Two accounts, two jobs" still
   * minimizes, so the student can actually switch tabs as instructed.
   */
  get hasAction(): boolean {
    return !!this.svc.current.action;
  }

  get primaryLabel(): string {
    if (this.svc.isFirst) return this.svc.current.cta || "Let's go";
    if (this.svc.isLast) return this.svc.current.cta || 'Finish';
    return this.hasAction ? 'Got it, let me try' : 'Next';
  }

  primary(): void {
    if (this.svc.isFirst) { this.svc.next(); return; }
    if (this.svc.isLast) { this.svc.finish(); return; }
    if (this.hasAction) { this.svc.minimize(); return; }
    this.svc.next();
  }

  /** Callout position relative to the spotlight (below if there is room, else above). */
  get calloutStyle(): { [k: string]: string } {
    const width = 360;
    if (!this.spotRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: width + 'px' };
    }
    const s = this.spotRect;
    const vh = window.innerHeight, vw = window.innerWidth;
    const h = this.calloutHeight || 200; // measured callout height (fallback before first measure)
    const gap = 14, margin = 12;
    // Prefer below the spotlight; flip above when there isn't room.
    let top = (s.top + s.height + gap + h + margin <= vh)
      ? s.top + s.height + gap
      : s.top - gap - h;
    // Final clamp: keep the whole callout (and its Back/Next buttons) on-screen.
    top = Math.max(margin, Math.min(top, vh - h - margin));
    let left = s.left + s.width / 2 - width / 2;
    left = Math.max(margin, Math.min(left, vw - width - margin));
    return { top: top + 'px', left: left + 'px', width: width + 'px' };
  }

  /**
   * On step change: scroll the target into view, then measure as it settles.
   * The previous box is kept until the new one is measured, so the dim never
   * disappears between steps (the CSS transition slides the spotlight over).
   */
  private refreshTarget(): void {
    const sel = this.svc.active && this.svc.expanded ? this.svc.current.target : undefined;
    if (!sel) {
      this.measure(); // leaving the tour: clear the spotlight
      // After the tour scrolled down, bring steps that ask for it back to the top.
      if (this.svc.active && this.svc.expanded && this.svc.current.scrollTop) {
        document.querySelector('.browser-content')?.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    this.measure(); // move to the new box right away
    [60, 220, 450, 800].forEach(t => setTimeout(() => this.measure(), t));
  }

  /** Read the current target's box and update the spotlight. */
  private measure(): void {
    const sel = this.svc.active && this.svc.expanded ? this.svc.current.target : undefined;
    if (!sel) { if (this.spotRect) { this.spotRect = null; this.cdr.detectChanges(); } return; }
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) { return; } // target not rendered yet: keep the current box, don't flash
    const r = el.getBoundingClientRect();
    this.spotRect = { top: r.top, left: r.left, width: r.width, height: r.height };
    const callout = document.querySelector('.wt-callout') as HTMLElement | null;
    if (callout) { this.calloutHeight = callout.offsetHeight; }
    this.cdr.detectChanges();
  }
}
