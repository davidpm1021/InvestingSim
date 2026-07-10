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
      <mat-icon class="intro-icon">lightbulb</mat-icon>
      <span class="intro-text">{{ text }}</span>
      <button mat-icon-button class="intro-close" (click)="dismiss()" aria-label="Dismiss">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <button *ngIf="!show" mat-icon-button class="intro-help" (click)="reopen()"
            matTooltip="Show tips for this page" aria-label="Show tips">
      <mat-icon>help_outline</mat-icon>
    </button>
  `,
  styles: [`
    .page-intro {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      margin-bottom: 12px;
      background: #eef4fc;
      border: 1px solid #d4e3f7;
      border-radius: 8px;
      color: #33475b;
    }
    .intro-icon { color: #275ce4; }
    .intro-text { flex: 1; line-height: 1.4; }
    .intro-close { margin: -8px -8px -8px 0; }
    .intro-help { color: #275ce4; }
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
