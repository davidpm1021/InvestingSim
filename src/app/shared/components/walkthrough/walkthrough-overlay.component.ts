import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { A11yModule } from '@angular/cdk/a11y';
import { Subscription, combineLatest } from 'rxjs';
import { WalkthroughService } from '../../services/walkthrough.service';
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
            <span class="wt-step">{{ svc.index + 1 }} / {{ svc.total }}</span>
          </div>
          <h3 class="wt-ct-title">{{ svc.current.title }}</h3>
          <p class="wt-ct-body" *ngFor="let p of svc.current.body">{{ p }}</p>
          <div class="wt-actions">
            <button mat-button type="button" class="wt-skip" (click)="svc.finish()">Skip</button>
            <span class="wt-spacer"></span>
            <button mat-button type="button" *ngIf="!svc.isFirst" (click)="svc.prev()">Back</button>
            <button mat-raised-button color="primary" type="button" cdkFocusInitial (click)="svc.next()">Next</button>
          </div>
        </div>
      </ng-container>

      <!-- ===== LEARNING moment: centered pop-up ===== -->
      <div class="wt-scrim" *ngIf="(svc.expanded$ | async) && !svc.current.target"
           role="dialog" aria-modal="true" [attr.aria-label]="svc.current.title">
        <div class="wt-card" cdkTrapFocus [cdkTrapFocusAutoCapture]="true"
             (keydown.escape)="svc.minimize()">
          <button class="wt-close" type="button" (click)="svc.minimize()"
                  aria-label="Minimize so you can try it">
            <mat-icon>remove</mat-icon>
          </button>
          <div class="wt-meta">
            <span class="wt-chip">{{ svc.current.part }}</span>
            <span class="wt-step">Step {{ svc.index + 1 }} of {{ svc.total }}</span>
          </div>
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
    .wt-step { font-size: 0.78rem; color: #666; font-weight: 500; }

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

    .wt-actions { display: flex; align-items: center; gap: 8px; }
    .wt-spacer { flex: 1; }
    .wt-skip { color: #9aa3ad !important; }

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

  constructor(public svc: WalkthroughService, private cdr: ChangeDetectorRef) {}

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
