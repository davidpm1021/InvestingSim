import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FirstVisitService } from '../../services/first-visit.service';

/**
 * Dismissible first-visit orientation callout. Shows once per page (tracked via
 * FirstVisitService); a "?" button reopens it. Not a forced walkthrough.
 */
@Component({
  selector: 'app-page-intro',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="page-intro" *ngIf="show">
      <mat-icon class="intro-icon" fontIcon="fa-lightbulb"></mat-icon>
      <span class="intro-text">{{ text }}</span>
      <button mat-icon-button class="intro-close" (click)="dismiss()" aria-label="Dismiss">
        <mat-icon fontIcon="fa-xmark"></mat-icon>
      </button>
    </div>
    <button *ngIf="!show" mat-icon-button class="intro-help" (click)="reopen()"
            matTooltip="Show tips for this page" aria-label="Show tips">
      <mat-icon fontIcon="fa-circle-question"></mat-icon>
    </button>
  `,
  styles: [`
    .page-intro {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      margin-bottom: 16px;
      background: rgba(39, 92, 228, 0.16);
      border: 1px solid rgba(255, 255, 255, 0.10);
      border-radius: 12px;
      color: #dfe6f7;
    }
    .intro-icon { color: #36ebff; }
    .intro-text { flex: 1; line-height: 1.45; font-weight: 500; }
    .intro-close { margin: -8px -8px -8px 0; color: #cfd9e0; }
    .intro-help { color: #36ebff; }
  `]
})
export class PageIntroComponent implements OnInit {
  @Input() pageKey = '';
  @Input() text = '';
  show = false;

  constructor(private firstVisit: FirstVisitService) {}

  ngOnInit(): void {
    this.show = !this.firstVisit.hasVisited(this.pageKey);
  }

  dismiss(): void {
    this.show = false;
    this.firstVisit.markVisited(this.pageKey);
  }

  reopen(): void {
    this.show = true;
  }
}
