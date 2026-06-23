import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { WalkthroughService } from '../../services/walkthrough.service';

/**
 * The guided walkthrough UI. Each step shows as a full-screen "learning moment"
 * pop-up (EXPANDED). After reading, the student minimizes it to a small docked
 * coach bar, does the action in the live app, then clicks "Next step" to bring
 * up the next pop-up.
 */
@Component({
  selector: 'app-walkthrough-overlay',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <ng-container *ngIf="svc.active$ | async">
      <!-- EXPANDED: blocking learning moment -->
      <div class="wt-scrim" *ngIf="svc.expanded$ | async"
           role="dialog" aria-modal="true" [attr.aria-label]="svc.current.title">
        <div class="wt-card">
          <button class="wt-close" type="button" (click)="svc.minimize()"
                  aria-label="Minimize so you can try it">
            <mat-icon>remove</mat-icon>
          </button>

          <div class="wt-meta">
            <span class="wt-chip">{{ svc.current.part }}</span>
            <span class="wt-step">Step {{ svc.index + 1 }} of {{ svc.total }}</span>
          </div>

          <h2 class="wt-title">{{ svc.current.title }}</h2>
          <p class="wt-body" *ngFor="let p of svc.current.body">{{ p }}</p>

          <div class="wt-action" *ngIf="svc.current.action">
            <mat-icon>touch_app</mat-icon>
            <span>{{ svc.current.action }}</span>
          </div>

          <div class="wt-progress"><span class="wt-bar" [style.width.%]="pct"></span></div>

          <div class="wt-actions">
            <button mat-button type="button" *ngIf="!svc.isFirst" (click)="svc.prev()">Back</button>
            <span class="wt-spacer"></span>
            <button mat-raised-button color="primary" type="button" (click)="primary()">
              {{ primaryLabel }}
            </button>
          </div>
        </div>
      </div>

      <!-- MINIMIZED: docked coach bar (student interacts with the app) -->
      <div class="wt-coach" *ngIf="!(svc.expanded$ | async)">
        <button class="wt-coach-expand" type="button" (click)="svc.expand()"
                aria-label="Show the full step">
          <mat-icon>unfold_more</mat-icon>
        </button>
        <div class="wt-coach-text">
          <span class="wt-chip sm">{{ svc.current.part }}</span>
          <span class="wt-coach-action">{{ svc.current.action || svc.current.title }}</span>
        </div>
        <div class="wt-coach-actions">
          <button mat-button type="button" *ngIf="!svc.isFirst" (click)="svc.prev()">Back</button>
          <button mat-raised-button color="primary" type="button" (click)="svc.next()">
            {{ svc.isLast ? 'Finish' : 'Next step' }}
            <mat-icon *ngIf="!svc.isLast" iconPositionEnd>arrow_forward</mat-icon>
          </button>
          <button class="wt-coach-end" type="button" (click)="svc.finish()" aria-label="End the guide">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    /* ---------- expanded pop-up ---------- */
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
      letter-spacing: 0.3px; text-transform: uppercase; padding: 4px 10px; border-radius: 999px;
      white-space: nowrap;
    }
    .wt-chip.sm { font-size: 0.66rem; padding: 3px 8px; }
    .wt-step { font-size: 0.78rem; color: #666; font-weight: 500; }

    .wt-title { margin: 0 0 12px; font-size: 1.5rem; font-weight: 700; color: #1d2733; }
    .wt-body { margin: 0 0 12px; font-size: 0.98rem; line-height: 1.55; color: #41494f; }

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

    /* ---------- minimized coach bar ---------- */
    .wt-coach {
      position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%);
      z-index: 2500; display: flex; align-items: center; gap: 14px;
      width: min(720px, calc(100vw - 32px));
      padding: 10px 12px 10px 8px; background: #fff; border: 1px solid #e3e8ef;
      border-radius: 999px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
      font-family: 'Montserrat', sans-serif; animation: wt-rise 0.2s ease;
    }
    @keyframes wt-rise { from { transform: translate(-50%, 12px); opacity: 0; } to { transform: translateX(-50%); opacity: 1; } }

    .wt-coach-expand {
      flex-shrink: 0; border: none; background: #e3f2fd; color: #1565c0; cursor: pointer;
      width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    }
    .wt-coach-expand:hover { background: #cfe6fb; }

    .wt-coach-text { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; }
    .wt-coach-action {
      font-size: 0.9rem; font-weight: 600; color: #2e7d32;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .wt-coach-actions { flex-shrink: 0; display: flex; align-items: center; gap: 4px; }
    .wt-coach-actions .mat-mdc-raised-button { border-radius: 999px; }

    .wt-coach-end {
      border: none; background: transparent; color: #9aa3ad; cursor: pointer;
      width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    }
    .wt-coach-end:hover { background: #f0f2f5; color: #5c636a; }

    @media (max-width: 600px) {
      .wt-coach-action { display: none; }
    }
  `]
})
export class WalkthroughOverlayComponent {
  constructor(public svc: WalkthroughService) {}

  get pct(): number { return ((this.svc.index + 1) / this.svc.total) * 100; }

  /** Welcome jumps straight in; the last step finishes; the rest minimize so the
   *  student can do the action, then proceed from the coach bar. */
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
}
