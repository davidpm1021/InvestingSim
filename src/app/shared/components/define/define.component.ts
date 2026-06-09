import { Component, Input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GLOSSARY } from '../../data/glossary';

/**
 * Inline definition: renders a dotted-underlined term that shows a 1–2 sentence
 * refresher on hover/tap. One glossary source (see glossary.ts).
 * Usage: <app-define term="APY"></app-define> or <app-define term="APY" label="1.50% APY">
 */
@Component({
  selector: 'app-define',
  standalone: true,
  imports: [MatTooltipModule],
  template: `<span class="defined-term" [matTooltip]="definition" tabindex="0">{{ label || term }}</span>`,
  styles: [`
    .defined-term {
      border-bottom: 1px dotted #1976d2;
      cursor: help;
    }
  `]
})
export class DefineComponent {
  @Input() term = '';
  @Input() label = '';

  get definition(): string {
    return GLOSSARY[this.term] || '';
  }
}
