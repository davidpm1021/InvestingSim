import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LiveAnnouncer } from '@angular/cdk/a11y';

export interface AppNotification {
  message: string;
  date: string; // simulation date (YYYY-MM-DD)
  read: boolean;
  link?: string;
}

/**
 * Factual account notifications only — statement-ready and trade/order confirmations.
 * Never coaching/advice (a real brokerage wouldn't). Persisted to localStorage.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private readonly KEY = 'investing_sim__notifications';
  private subject = new BehaviorSubject<AppNotification[]>(this.load());
  public notifications$: Observable<AppNotification[]> = this.subject.asObservable();

  constructor(private liveAnnouncer: LiveAnnouncer) {}

  add(message: string, link?: string, date?: string): void {
    const notification: AppNotification = {
      message,
      link,
      read: false,
      date: date || ''
    };
    const next = [notification, ...this.subject.value].slice(0, 50);
    this.subject.next(next);
    this.save(next);
    // Announce to assistive tech (WCAG 4.1.3 Status Messages).
    this.liveAnnouncer.announce(message, 'polite');
  }

  markAllRead(): void {
    const next = this.subject.value.map(n => ({ ...n, read: true }));
    this.subject.next(next);
    this.save(next);
  }

  get unreadCount(): number {
    return this.subject.value.filter(n => !n.read).length;
  }

  private load(): AppNotification[] {
    try {
      const stored = localStorage.getItem(this.KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Error reading notifications from localStorage:', error);
    }
    return [];
  }

  private save(list: AppNotification[]): void {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(list));
    } catch (error) {
      console.error('Error saving notifications to localStorage:', error);
    }
  }
}
