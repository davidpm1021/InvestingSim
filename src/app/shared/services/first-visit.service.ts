import { Injectable } from '@angular/core';

/**
 * Tracks which pages a student has already seen, so first-visit orientation callouts
 * show once and then stay dismissed (reopenable via the page's "?").
 */
@Injectable({
  providedIn: 'root'
})
export class FirstVisitService {
  private readonly KEY = 'investing_sim__visited_pages';
  private visited = new Set<string>(this.load());

  hasVisited(page: string): boolean {
    return this.visited.has(page);
  }

  markVisited(page: string): void {
    this.visited.add(page);
    this.save();
  }

  private load(): string[] {
    try {
      const stored = localStorage.getItem(this.KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Error reading visited pages from localStorage:', error);
    }
    return [];
  }

  private save(): void {
    try {
      localStorage.setItem(this.KEY, JSON.stringify([...this.visited]));
    } catch (error) {
      console.error('Error saving visited pages to localStorage:', error);
    }
  }
}
