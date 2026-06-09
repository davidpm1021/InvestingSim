import { Pipe, PipeTransform } from '@angular/core';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/** Shared short month names — the single home for chart-axis labels etc. */
export const MONTHS_SHORT = MONTHS.map(m => m.slice(0, 3));

/**
 * Formats a YYYY-MM-DD date as a year-less label ("April 1", or "Apr 1" in short
 * style). The app is evergreen — we never display a year. Internal ISO dates are
 * unchanged; only the display drops the year.
 */
@Pipe({
  name: 'evergreenDate',
  standalone: true
})
export class EvergreenDatePipe implements PipeTransform {
  transform(value: string | null | undefined, style: 'long' | 'short' = 'long'): string {
    if (!value) {
      return '';
    }
    const parts = value.split('-');
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (!month || !day) {
      return '';
    }
    const name = style === 'short' ? MONTHS[month - 1].slice(0, 3) : MONTHS[month - 1];
    return `${name} ${day}`;
  }
}
