import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { A11yModule } from '@angular/cdk/a11y';
import { Subscription, combineLatest } from 'rxjs';
import { WalkthroughService } from '../../services/walkthrough.service';
import { ResponsesService } from '../../services/responses.service';
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
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, A11yModule],
  template: `
    <ng-container *ngIf="svc.active$ | async">

      <!-- ===== TOUR: spotlight + anchored callout ===== -->
      <ng-container *ngIf="(svc.expanded$ | async) && svc.current.target">
        <div class="wt-block"></div>
        <div class="wt-spot" *ngIf="spotRect"
             [style.top.px]="spotRect.top - 6" [style.left.px]="spotRect.left - 6"
             [style.width.px]="spotRect.width + 12" [style.height.px]="spotRect.height + 12"></div>
        <div class="wt-callout" [ngStyle]="calloutStyle" role="dialog" aria-modal="true"
             cdkTrapFocus [cdkTrapFocusAutoCapture]="true" (keydown.escape)="svc.finish()"
             [attr.aria-label]="svc.current.title">
          <div class="wt-meta">
            <span class="wt-chip">{{ svc.current.part }}</span>
          </div>
          <h3 class="wt-ct-title">{{ svc.current.title }}</h3>
          <p class="wt-ct-body" *ngFor="let p of svc.current.body">{{ p }}</p>
          <div class="wt-actions">
            <button mat-button type="button" class="wt-skip" (click)="svc.skipTour()">Skip tour</button>
            <span class="wt-spacer"></span>
            <button mat-button type="button" *ngIf="!svc.isFirst" (click)="svc.prev()">Back</button>
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
            <mat-icon>remove</mat-icon>
          </button>
          <div class="wt-meta">
            <span class="wt-chip">{{ svc.current.part }}</span>
          </div>
          <!-- ===== QUESTION screen: its own step, notebook / paper look ===== -->
          <ng-container *ngIf="svc.current.kind === 'question'; else instruction">
            <div class="wt-cfu-head">
              <mat-icon aria-hidden="true">edit</mat-icon>
              <span>Check yourself</span>
            </div>
            <div class="wt-cfu" *ngFor="let q of svc.current.questions">
              <fieldset class="wt-cfu-mc" *ngIf="q.kind === 'mc'">
                <legend class="wt-cfu-q">{{ q.prompt }}</legend>
                <label class="wt-choice" *ngFor="let opt of shuffledChoices(q)"
                       [class.selected]="isSelected(q, opt.i)"
                       [class.correct]="isAnswered(q) && opt.c.correct"
                       [class.wrong]="isAnswered(q) && isSelected(q, opt.i) && !opt.c.correct">
                  <input type="radio" [name]="q.id" [checked]="isSelected(q, opt.i)" (change)="selectChoice(q, opt.i)">
                  <span class="wt-choice-text">{{ opt.c.text }}</span>
                  <mat-icon class="wt-choice-mark" *ngIf="isAnswered(q) && opt.c.correct">check</mat-icon>
                  <mat-icon class="wt-choice-mark" *ngIf="isAnswered(q) && isSelected(q, opt.i) && !opt.c.correct">close</mat-icon>
                </label>
                <p class="wt-cfu-exp" *ngIf="isAnswered(q)" [class.right]="isSelectedCorrect(q)">
                  <strong>{{ isSelectedCorrect(q) ? 'Correct.' : 'Not quite.' }}</strong> {{ q.explanation }}
                </p>
              </fieldset>
              <div class="wt-cfu-free" *ngIf="q.kind === 'free'">
                <label class="wt-cfu-q" [attr.for]="q.id">{{ q.prompt }}</label>
                <textarea [id]="q.id" class="wt-cfu-text" rows="4" [value]="textFor(q)"
                          (input)="saveText(q, $event)" placeholder="Type your answer..."></textarea>
              </div>
            </div>
            <div class="wt-progress"><span class="wt-bar" [style.width.%]="pct"></span></div>
            <div class="wt-actions">
              <button mat-button type="button" *ngIf="!svc.isFirst" (click)="svc.prev()">Back</button>
              <span class="wt-spacer"></span>
              <button mat-raised-button color="primary" type="button" cdkFocusInitial (click)="svc.next()">
                {{ svc.isLast ? 'Finish' : 'Continue' }}
              </button>
            </div>
          </ng-container>

          <!-- ===== INSTRUCTION screen ===== -->
          <ng-template #instruction>
            <h2 class="wt-title">{{ svc.current.title }}</h2>
            <p class="wt-body" *ngFor="let segs of bodySegments"><ng-container *ngFor="let seg of segs"><span *ngIf="seg.def" class="wt-def" [matTooltip]="seg.def" matTooltipPosition="above" tabindex="0">{{ seg.t }}</span><span *ngIf="!seg.def">{{ seg.t }}</span></ng-container></p>
            <div class="wt-action" *ngIf="svc.current.action">
              <mat-icon>touch_app</mat-icon>
              <span>{{ svc.current.action }}</span>
            </div>
            <div class="wt-progress"><span class="wt-bar" [style.width.%]="pct"></span></div>
            <div class="wt-actions">
              <button mat-button type="button" *ngIf="!svc.isFirst" (click)="svc.prev()">Back</button>
              <span class="wt-spacer"></span>
              <button mat-raised-button color="primary" type="button" cdkFocusInitial (click)="primary()">{{ primaryLabel }}</button>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- ===== MINIMIZED: coach bar (click anywhere on the bar to expand) ===== -->
      <div class="wt-coach" *ngIf="!(svc.expanded$ | async)" (click)="svc.expand()">
        <div class="wt-coach-text">
          <span class="wt-chip sm">{{ svc.current.part }}</span>
          <span class="wt-coach-action">{{ svc.current.action || svc.current.title }}</span>
        </div>
        <div class="wt-coach-actions">
          <button mat-button type="button" *ngIf="!svc.isFirst" (click)="svc.prev(); $event.stopPropagation()">Back</button>
          <button mat-raised-button color="primary" type="button" (click)="svc.next(); $event.stopPropagation()">
            {{ svc.isLast ? 'Finish' : 'Next step' }}
          </button>
          <button class="wt-coach-end" type="button" (click)="svc.finish(); $event.stopPropagation()" aria-label="End the guide">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    .wt-scrim {
      position: fixed; inset: 0; z-index: 3000;
      display: flex; align-items: center; justify-content: center; padding: 24px;
      background: rgba(15, 30, 55, 0.55); backdrop-filter: blur(2px);
      animation: wt-fade 0.2s ease;
    }
    @keyframes wt-fade { from { opacity: 0; } to { opacity: 1; } }

    .wt-card {
      position: relative; width: 100%; max-width: 560px; max-height: 88vh; overflow-y: auto;
      background: #fff; border-radius: 16px; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
      padding: 28px 28px 20px; font-family: 'Montserrat', sans-serif;
      animation: wt-pop 0.25s cubic-bezier(0.2, 0.7, 0.3, 1);
    }
    @keyframes wt-pop { from { transform: scale(0.95) translateY(10px); opacity: 0; } to { transform: none; opacity: 1; } }

    .wt-close {
      position: absolute; top: 12px; right: 12px; border: none; background: transparent;
      color: #9aa3ad; cursor: pointer; padding: 4px; line-height: 0; border-radius: 50%;
    }
    .wt-close:hover { background: #f0f2f5; color: #5c636a; }

    .wt-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .wt-chip {
      background: #e3f2fd; color: #1565c0; font-size: 0.72rem; font-weight: 700;
      letter-spacing: 0.3px; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; white-space: nowrap;
    }
    .wt-chip.sm { font-size: 0.66rem; padding: 3px 8px; }

    .wt-title { margin: 0 0 12px; font-size: 1.5rem; font-weight: 700; color: #1d2733; }
    .wt-body { margin: 0 0 12px; font-size: 0.98rem; line-height: 1.55; color: #41494f; }
    .wt-def { border-bottom: 1px dotted #1565c0; cursor: help; }

    .wt-action {
      display: flex; align-items: flex-start; gap: 10px; margin: 16px 0 8px;
      padding: 12px 14px; background: #eef6ee; border-left: 4px solid #2e7d32;
      border-radius: 8px; font-size: 0.92rem; font-weight: 600; color: #1f5a26;
    }
    .wt-action mat-icon { color: #2e7d32; flex-shrink: 0; }

    .wt-progress { height: 4px; background: #eceff3; border-radius: 999px; margin: 18px 0 14px; overflow: hidden; }
    .wt-bar { display: block; height: 100%; background: #1565c0; border-radius: 999px; transition: width 0.3s ease; }

    /* ---------- check-for-understanding: its own step, notebook / paper look ---------- */
    .wt-card--quiz {
      background: #fffdf5; border: 1px solid #e5d9b6;
      box-shadow: 0 16px 48px rgba(70, 58, 24, 0.32);
    }
    /* a torn strip of tape at the top corner, to sell the notecard feel */
    .wt-card--quiz::before {
      content: ''; position: absolute; top: -10px; left: 30px; width: 76px; height: 20px;
      background: rgba(214, 199, 143, 0.6); border: 1px solid rgba(190, 172, 108, 0.5);
      transform: rotate(-3deg); border-radius: 2px;
    }
    .wt-cfu-head {
      display: flex; align-items: center; gap: 8px; margin: 4px 0 14px;
      font-family: 'Caveat', 'Comic Sans MS', cursive; font-weight: 700;
      font-size: 1.9rem; line-height: 1; color: #6b5d2f;
    }
    .wt-cfu-head mat-icon { color: #a08a3f; font-size: 24px; width: 24px; height: 24px; }
    .wt-cfu + .wt-cfu { margin-top: 18px; padding-top: 16px; border-top: 1px dashed #e2d6ad; }
    .wt-cfu-mc { border: none; margin: 0; padding: 0; min-width: 0; }
    .wt-cfu-q { font-size: 0.98rem; font-weight: 700; color: #1d2733; padding: 0; margin: 0 0 10px; line-height: 1.4; }
    .wt-choice {
      display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; margin-bottom: 8px;
      background: #fff; border: 1.5px solid #d7dde5; border-radius: 10px; cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease;
    }
    .wt-choice:hover { background: #f5f8fc; }
    .wt-choice:focus-within { outline: 2px solid #1976d2; outline-offset: 2px; }
    .wt-choice input { margin: 2px 0 0; flex-shrink: 0; width: 16px; height: 16px; accent-color: #1565c0; }
    .wt-choice-text { flex: 1; font-size: 0.92rem; line-height: 1.45; color: #41494f; }
    .wt-choice-mark { flex-shrink: 0; font-size: 20px; width: 20px; height: 20px; }
    .wt-choice.selected { border-color: #1565c0; }
    .wt-choice.correct { border-color: #1b7a2f; background: #e9f6ec; }
    .wt-choice.correct .wt-choice-mark { color: #1b7a2f; }
    .wt-choice.wrong { border-color: #c0392b; background: #fbecea; }
    .wt-choice.wrong .wt-choice-mark { color: #c0392b; }
    .wt-cfu-exp {
      margin: 4px 2px 0; font-size: 0.88rem; line-height: 1.5; color: #41494f;
      background: #f0f4f9; border-left: 4px solid #1565c0; border-radius: 8px; padding: 10px 12px;
    }
    .wt-cfu-exp.right { background: #eef6ee; border-left-color: #1b7a2f; }
    .wt-cfu-exp strong { color: #1d2733; }
    .wt-cfu-free { display: flex; flex-direction: column; gap: 8px; }
    .wt-cfu-text {
      width: 100%; box-sizing: border-box; resize: vertical; min-height: 84px;
      background: #fff; border: 1.5px solid #d7dde5; border-radius: 10px; padding: 10px 12px;
      font-family: 'Montserrat', sans-serif; font-size: 0.92rem; line-height: 1.5; color: #1d2733;
    }
    .wt-cfu-text:focus { outline: none; border-color: #1565c0; box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.15); }

    .wt-actions { display: flex; align-items: center; gap: 8px; }
    .wt-spacer { flex: 1; }
    .wt-skip { color: #5c636a !important; } /* darker grey for >=4.5:1 contrast on the white callout */

    /* ---------- tour spotlight ---------- */
    .wt-block { position: fixed; inset: 0; z-index: 3000; background: transparent; }
    .wt-spot {
      position: fixed; z-index: 3001; pointer-events: none;
      border: 2px solid #1565c0; border-radius: 10px;
      box-shadow: 0 0 0 9999px rgba(15, 30, 55, 0.6);
      transition: top 0.2s ease, left 0.2s ease, width 0.2s ease, height 0.2s ease;
    }
    .wt-callout {
      position: fixed; z-index: 3002; box-sizing: border-box;
      background: #fff; border-radius: 14px; box-shadow: 0 14px 40px rgba(0, 0, 0, 0.4);
      padding: 16px 18px 12px; font-family: 'Montserrat', sans-serif;
      animation: wt-pop 0.2s cubic-bezier(0.2, 0.7, 0.3, 1);
      transition: top 0.2s ease, left 0.2s ease;
    }
    .wt-ct-title { margin: 0 0 6px; font-size: 1.1rem; font-weight: 700; color: #1d2733; }
    .wt-ct-body { margin: 0 0 8px; font-size: 0.9rem; line-height: 1.5; color: #41494f; }

    /* ---------- minimized coach bar ---------- */
    .wt-coach {
      position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%);
      z-index: 2500; display: flex; align-items: center; gap: 14px;
      width: min(720px, calc(100vw - 32px));
      padding: 10px 12px 10px 18px; background: #fff; border: 1px solid #e3e8ef;
      border-radius: 999px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
      font-family: 'Montserrat', sans-serif; animation: wt-rise 0.2s ease; cursor: pointer;
    }
    @keyframes wt-rise { from { transform: translate(-50%, 12px); opacity: 0; } to { transform: translateX(-50%); opacity: 1; } }
    .wt-coach-text { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; }
    .wt-coach-action { font-size: 0.9rem; font-weight: 600; color: #2e7d32; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .wt-coach-actions { flex-shrink: 0; display: flex; align-items: center; gap: 4px; }
    .wt-coach-actions .mat-mdc-raised-button { border-radius: 999px; }
    .wt-coach-end {
      border: none; background: transparent; color: #9aa3ad; cursor: pointer;
      width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    }
    .wt-coach-end:hover { background: #f0f2f5; color: #5c636a; }
    @media (max-width: 600px) { .wt-coach-action { display: none; } }
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
  private readonly termRe = /(target-date funds?|bond funds?|mutual funds?|index funds?|\bETFs?\b|\bstocks?\b|(?<!add )(?<!withdraw )\bfunds?\b|\bdividends?\b|\bdiversification\b|\bbrokerage(?: account)?\b|\bsettlement\b|\bcompounding\b|\bvolatility\b)/gi;

  constructor(
    public svc: WalkthroughService,
    private responses: ResponsesService,
    private cdr: ChangeDetectorRef,
  ) {}

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
  textFor(q: CfuQuestion): string {
    return this.responses.get(q.id)?.text ?? '';
  }
  saveText(q: CfuQuestion, ev: Event): void {
    this.responses.setText(q.id, (ev.target as HTMLTextAreaElement).value);
  }

  ngOnInit(): void {
    window.addEventListener('scroll', this.onScroll, true); // capture: catch inner scroll
    window.addEventListener('resize', this.onResize);
    this.sub.add(
      combineLatest([this.svc.active$, this.svc.index$, this.svc.expanded$])
        .subscribe(() => {
          this.bodySegments = (this.svc.current?.body || []).map(p => this.defineSegments(p));
          this.refreshTarget();
        })
    );
  }

  /** Split a paragraph into plain text and glossary-term segments (term carries its definition). */
  private defineSegments(text: string): Segment[] {
    const out: Segment[] = [];
    let last = 0;
    this.termRe.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = this.termRe.exec(text)) !== null) {
      if (m.index > last) { out.push({ t: text.slice(last, m.index), def: null }); }
      out.push({ t: m[0], def: this.defFor(m[0]) });
      last = m.index + m[0].length;
    }
    if (last < text.length) { out.push({ t: text.slice(last), def: null }); }
    return out;
  }

  /** Glossary definition for a matched term (null if unknown). */
  private defFor(matched: string): string | null {
    const m = matched.toLowerCase();
    const key =
      m.includes('target-date fund') ? 'Target-date fund' :
      m.includes('bond fund') ? 'Bond fund' :
      m.includes('mutual fund') ? 'Mutual fund' :
      m.includes('index fund') ? 'Index fund' :
      m.startsWith('etf') ? 'ETF' :
      m.startsWith('stock') ? 'Stock' :
      m.startsWith('fund') ? 'Fund' :
      m.startsWith('dividend') ? 'Dividend' :
      m.startsWith('diversification') ? 'Diversification' :
      m.startsWith('brokerage') ? 'Brokerage account' :
      m.startsWith('settlement') ? 'Cash Settlement Account' :
      m.startsWith('compounding') ? 'Compounding' :
      m.startsWith('volatility') ? 'Volatility' : '';
    return key ? (GLOSSARY[key] || null) : null;
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll, true);
    window.removeEventListener('resize', this.onResize);
    this.sub.unsubscribe();
  }

  get pct(): number { return ((this.svc.index + 1) / this.svc.total) * 100; }

  get primaryLabel(): string {
    if (this.svc.isFirst) return this.svc.current.cta || "Let's go";
    if (this.svc.isLast) return this.svc.current.cta || 'Finish';
    return 'Got it, let me try';
  }

  primary(): void {
    if (this.svc.isFirst) { this.svc.next(); return; }
    if (this.svc.isLast) { this.svc.finish(); return; }
    this.svc.minimize();
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
