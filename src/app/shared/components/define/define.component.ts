import { Component, Input, OnDestroy } from '@angular/core';
import { OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';
import { GLOSSARY } from '../../data/glossary';

let nextPopId = 0;

/**
 * Inline definition: a dotted-underlined term that shows a 1-2 sentence refresher
 * on hover or keyboard focus. One glossary source (see glossary.ts).
 *
 * Uses a CDK overlay popover (not matTooltip) so it meets WCAG 1.4.13 Content on
 * Hover or Focus: the popover is hoverable (a short close delay lets the pointer
 * move onto it), dismissable with Escape, and persistent until dismissed or the
 * pointer/focus leaves. Rendering in the overlay layer also avoids being clipped
 * inside scrolling containers like the walkthrough card.
 *
 * Usage: <app-define term="APY"></app-define>, with an optional label
 * (<app-define term="APY" label="1.50% APY">), or a precomputed definition
 * (<app-define [def]="text" label="...">) when the caller already has the text.
 */
@Component({
  selector: 'app-define',
  standalone: true,
  imports: [OverlayModule],
  template: `
    <span cdkOverlayOrigin #trigger="cdkOverlayOrigin"
          class="defined-term" tabindex="0"
          (mouseenter)="show()" (mouseleave)="scheduleHide()"
          (focus)="show()" (blur)="scheduleHide()"
          (keydown.escape)="dismiss($event)"
          [attr.aria-describedby]="open ? popId : null">{{ label || term }}</span>

    <ng-template cdkConnectedOverlay
                 [cdkConnectedOverlayOrigin]="trigger"
                 [cdkConnectedOverlayOpen]="open"
                 [cdkConnectedOverlayPositions]="positions">
      <div class="define-pop" [id]="popId" role="tooltip"
           (mouseenter)="show()" (mouseleave)="scheduleHide()">{{ definition }}</div>
    </ng-template>
  `,
  styles: [`
    .defined-term {
      border-bottom: 1px dotted #275ce4;
      cursor: help;
    }
    .define-pop {
      max-width: 260px;
      background: #2b2f36;
      color: #fff;
      font-family: 'Montserrat', sans-serif;
      font-size: 0.8rem;
      line-height: 1.45;
      padding: 8px 12px;
      border-radius: 8px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.28);
    }
  `]
})
export class DefineComponent implements OnDestroy {
  @Input() term = '';
  @Input() label = '';
  /** Precomputed definition; overrides the glossary lookup when provided. */
  @Input() def = '';

  open = false;
  readonly popId = `define-pop-${nextPopId++}`;

  // Below the term, flipping above when there isn't room.
  readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
  ];

  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  get definition(): string {
    return this.def || GLOSSARY[this.term] || '';
  }

  /** Open (or keep open); called from the term and the popover so hover can bridge. */
  show(): void {
    this.clearTimer();
    if (this.definition) { this.open = true; }
  }

  /** Close after a short grace period so the pointer can move onto the popover. */
  scheduleHide(): void {
    this.clearTimer();
    this.hideTimer = setTimeout(() => { this.open = false; }, 150);
  }

  /** Escape dismisses without moving focus; stop it bubbling (e.g. to the
   *  walkthrough card, whose Escape minimizes the whole modal). */
  dismiss(event: Event): void {
    if (!this.open) { return; }
    event.stopPropagation();
    this.clearTimer();
    this.open = false;
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
  }
}
