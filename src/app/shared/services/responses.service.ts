import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CfuResponse {
  choiceIndex?: number; // selected option for a multiple-choice question
  text?: string;        // typed answer for a free-text question
}

type ResponseMap = { [questionId: string]: CfuResponse };

/**
 * Stores the student's answers to the check-for-understanding questions so they
 * survive navigation and reload. There is no teacher dashboard, so these are for
 * the student's own reflection only.
 *
 * Follows the BehaviorSubject + localStorage 'investing_sim__*' pattern used by
 * the other services.
 */
@Injectable({ providedIn: 'root' })
export class ResponsesService {
  private readonly RESPONSES_KEY = 'investing_sim__responses';

  private responsesSubject = new BehaviorSubject<ResponseMap>(this.getStoredState());
  public responses$: Observable<ResponseMap> = this.responsesSubject.asObservable();

  get(id: string): CfuResponse | undefined {
    return this.responsesSubject.value[id];
  }

  setChoice(id: string, choiceIndex: number): void {
    this.update(id, { choiceIndex });
  }

  setText(id: string, text: string): void {
    this.update(id, { text });
  }

  /** Clear all answers (for replaying the guide). */
  reset(): void {
    this.responsesSubject.next({});
    this.saveState({});
  }

  private update(id: string, patch: Partial<CfuResponse>): void {
    const current = this.responsesSubject.value;
    const next: ResponseMap = { ...current, [id]: { ...current[id], ...patch } };
    this.responsesSubject.next(next);
    this.saveState(next);
  }

  private getStoredState(): ResponseMap {
    try {
      const stored = localStorage.getItem(this.RESPONSES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') { return parsed as ResponseMap; }
      }
    } catch (error) {
      console.warn('Error reading responses from localStorage:', error);
    }
    return {};
  }

  private saveState(state: ResponseMap): void {
    try {
      localStorage.setItem(this.RESPONSES_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving responses to localStorage:', error);
    }
  }
}
