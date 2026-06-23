import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { WalkthroughService } from '../../services/walkthrough.service';

/**
 * Full-screen blocking "learning moment" pop-up. The student must read the step
 * and click Continue to advance; "Explore on my own" pauses the guide and leaves
 * a Resume pill so they can use the app and come back.
 */
@Component({
  selector: 'app-walkthrough-overlay',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <ng-container *ngIf="svc.active$ | async">
      <div class="wt-scrim" *ngIf="!(svc.paused$ | async)"
           role="dialog" aria-modal="true" [attr.aria-label]="svc.current.title">
        <div class="wt-card">
          <button class="wt-close" type="button" (click)="svc.pause()" aria-label="Hide the guide for now">
            <mat-icon>close</mat-icon>
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

          <div class="wt-progress"><span class="wt-bar" [style.width.%]="((svc.index + 1) / svc.total) * 100"></span></div>

          <div class="wt-actions">
            <button mat-button type="button" *ngIf="svc.index > 0" (click)="svc.prev()">Back</button>
            <span class="wt-spacer"></span>
            <button mat-button type="button" class="wt-explore" (click)="svc.pause()">Explore on my own</button>
            <button mat-raised-button color="primary" type="button" (click)="svc.next()">
              {{ svc.current.cta || 'Continue' }}
            </button>
          </div>
        </div>
      </div>

      <button class="wt-resume" type="button" *ngIf="svc.paused$ | async" (click)="svc.resume()">
        <mat-icon>menu_book</mat-icon> Resume guide
      </button>
    </ng-container>
  `,
  styles: [`
    .wt-scrim {
      position: fixed;
      inset: 0;
      z-index: 3000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(15, 30, 55, 0.55);
      backdrop-filter: blur(2px);
      animation: wt-fade 0.2s ease;
    }
    @keyframes wt-fade { from { opacity: 0; } to { opacity: 1; } }

    .wt-card {
      position: relative;
      width: 100%;
      max-width: 560px;
      max-height: 88vh;
      overflow-y: auto;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
      padding: 28px 28px 20px;
      font-family: 'Montserrat', sans-serif;
      animation: wt-pop 0.25s cubic-bezier(0.2, 0.7, 0.3, 1);
    }
    @keyframes wt-pop { from { transform: scale(0.95) translateY(10px); opacity: 0; } to { transform: none; opacity: 1; } }

    .wt-close {
      position: absolute;
      top: 12px;
      right: 12px;
      border: none;
      background: transparent;
      color: #9aa3ad;
      cursor: pointer;
      padding: 4px;
      line-height: 0;
      border-radius: 50%;
    }
    .wt-close:hover { background: #f0f2f5; color: #5c636a; }

    .wt-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .wt-chip {
      background: #e3f2fd;
      color: #1565c0;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 999px;
    }
    .wt-step { font-size: 0.78rem; color: #666; font-weight: 500; }

    .wt-title { margin: 0 0 12px; font-size: 1.5rem; font-weight: 700; color: #1d2733; }
    .wt-body { margin: 0 0 12px; font-size: 0.98rem; line-height: 1.55; color: #41494f; }

    .wt-action {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin: 16px 0 8px;
      padding: 12px 14px;
      background: #eef6ee;
      border-left: 4px solid #2e7d32;
      border-radius: 8px;
      font-size: 0.92rem;
      font-weight: 600;
      color: #1f5a26;
    }
    .wt-action mat-icon { color: #2e7d32; flex-shrink: 0; }

    .wt-progress { height: 4px; background: #eceff3; border-radius: 999px; margin: 18px 0 14px; overflow: hidden; }
    .wt-bar { display: block; height: 100%; background: #1565c0; border-radius: 999px; transition: width 0.3s ease; }

    .wt-actions { display: flex; align-items: center; gap: 8px; }
    .wt-spacer { flex: 1; }
    .wt-explore { color: #666 !important; }

    .wt-resume {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2500;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border: none;
      border-radius: 999px;
      background: #1565c0;
      color: #fff;
      font-family: 'Montserrat', sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(21, 101, 192, 0.4);
    }
    .wt-resume:hover { background: #124e98; }
    .wt-resume mat-icon { font-size: 20px; width: 20px; height: 20px; }
  `]
})
export class WalkthroughOverlayComponent {
  constructor(public svc: WalkthroughService) {}
}
