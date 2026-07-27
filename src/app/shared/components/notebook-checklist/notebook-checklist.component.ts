import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ChecklistService, MILESTONES, MilestoneKey } from '../../services/checklist.service';
import { DataService } from '../../services/data.service';
import { WalkthroughService } from '../../services/walkthrough.service';

/**
 * A persistent "notebook" checklist docked to the left gutter that crosses off
 * the seven headline actions of the brokerage activity as the student does them.
 *
 * Mounted at the app root (a sibling of the router-outlet and the walkthrough
 * overlay), so it is a fixed layer that is not clipped by the faux-browser
 * window's `overflow: hidden`. It shows only while the sim is open (web_browser
 * layout on /investing or /banking), collapses to a small tab, and auto-collapses
 * when the browser window is maximized or the viewport is too narrow for it.
 */
@Component({
  selector: 'app-notebook-checklist',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="nb-root" *ngIf="visible">
      <!-- Collapsed: a compact reopen tab on the left edge -->
      <button *ngIf="!showPanel" type="button" class="nb-reopen" (click)="toggle()"
              [attr.aria-expanded]="false" aria-label="Open your checklist">
        <span class="nb-reopen-badge"><mat-icon fontIcon="la-clipboard-check"></mat-icon></span>
        <span class="nb-reopen-text">My Checklist</span>
      </button>

      <!-- Expanded: light floating checklist card -->
      <aside *ngIf="showPanel" class="nb-panel" [class.complete]="doneCount === total" aria-label="Checklist">
        <div class="nb-head">
          <span class="nb-badge" aria-hidden="true"><mat-icon fontIcon="la-clipboard-check"></mat-icon></span>
          <div class="nb-titles">
            <span class="nb-title" role="heading" aria-level="2">My Checklist</span>
            <span class="nb-sub">Your first {{ total }} steps</span>
          </div>
          <button type="button" class="nb-collapse" (click)="toggle()"
                  [attr.aria-expanded]="true" aria-label="Collapse the checklist">
            <mat-icon fontIcon="la-chevron-left"></mat-icon>
          </button>
        </div>

        <ul class="nb-list">
          <li *ngFor="let m of milestones" class="nb-item" [class.done]="isDone(m.key)">
            <span class="nb-box" aria-hidden="true">
              <mat-icon *ngIf="isDone(m.key)" fontIcon="la-check"></mat-icon>
            </span>
            <span class="nb-label">{{ m.label }}</span>
            <span class="nb-sr" *ngIf="isDone(m.key)"> - done</span>
          </li>
        </ul>

        <div class="nb-done"><mat-icon fontIcon="la-trophy"></mat-icon> You're all set, nice work!</div>

        <div class="nb-foot">
          <span class="nb-count">{{ doneCount }} of {{ total }}</span>
          <div class="nb-bar"><span [style.width.%]="total ? doneCount / total * 100 : 0"></span></div>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .nb-root { position: fixed; left: 0; top: 0; bottom: 0; z-index: 2400;
      pointer-events: none; font-family: 'Montserrat', Helvetica, Arial, sans-serif; }
    .nb-root > * { pointer-events: auto; }

    /* ---------- light floating checklist card ---------- */
    .nb-panel {
      position: fixed; left: 16px; top: 150px; width: 300px; max-height: calc(100vh - 180px);
      display: flex; flex-direction: column; overflow: hidden;
      background: #f6f8fd; border-radius: 16px; color: #0b1541;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
      animation: nb-slide 0.22s cubic-bezier(0.2, 0.7, 0.3, 1);
    }
    @keyframes nb-slide { from { transform: translateX(-16px); opacity: 0; } to { transform: none; opacity: 1; } }

    /* Header with gradient badge */
    .nb-head { display: flex; align-items: center; gap: 12px; padding: 16px 18px 14px;
      background: linear-gradient(120deg, #eef2fe, #e3f7fb); }
    .nb-badge { width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; color: #fff;
      background: linear-gradient(135deg, #275ce4, #6c5ce7); box-shadow: 0 6px 16px rgba(39, 92, 228, 0.35); }
    .nb-badge mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .nb-titles { flex: 1; min-width: 0; }
    .nb-title { display: block; font-size: 18px; font-weight: 700; color: #0b1541; line-height: 1.1; }
    .nb-sub { font-size: 11px; font-weight: 600; color: #5a6472; }
    .nb-collapse { flex-shrink: 0; width: 28px; height: 28px; border: none; border-radius: 8px; cursor: pointer;
      background: rgba(11, 21, 65, 0.08); color: #0b1541; line-height: 0;
      display: flex; align-items: center; justify-content: center; }
    .nb-collapse:hover { background: rgba(11, 21, 65, 0.16); }
    .nb-collapse mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* Items */
    .nb-list { list-style: none; margin: 0; padding: 6px 18px 0; overflow-y: auto; }
    .nb-item { display: flex; align-items: center; gap: 12px; padding: 11px 2px;
      border-bottom: 1px solid rgba(11, 21, 65, 0.09); }
    .nb-item:last-child { border-bottom: none; }
    .nb-box { flex-shrink: 0; width: 22px; height: 22px; border-radius: 6px; background: #e0e6f2;
      display: flex; align-items: center; justify-content: center; }
    .nb-box mat-icon { font-size: 13px; width: 13px; height: 13px; color: #06122a; }
    .nb-item.done .nb-box { background: #36ebff; }
    .nb-label { flex: 1; font-size: 15px; font-weight: 600; color: #0b1541; line-height: 1.3; }
    .nb-item.done .nb-label { color: #6b7280; text-decoration: line-through; }

    /* Completion banner (shows at N/N) */
    .nb-done { display: none; align-items: center; gap: 10px; margin: 12px 18px 0; padding: 12px 14px;
      border-radius: 12px; background: #e1f3ea; color: #157347; font-size: 13px; font-weight: 700; }
    .nb-done mat-icon { font-size: 20px; width: 20px; height: 20px; color: #157347; flex-shrink: 0; }
    .nb-panel.complete .nb-done { display: flex; }

    /* Footer progress */
    .nb-foot { display: flex; align-items: center; gap: 10px; margin: 14px 18px 16px; }
    .nb-count { font-size: 13px; font-weight: 700; color: #3a4560; white-space: nowrap; }
    .nb-bar { flex: 1; height: 8px; border-radius: 999px; background: rgba(11, 21, 65, 0.10); overflow: hidden; }
    .nb-bar span { display: block; height: 100%; border-radius: 999px;
      background: linear-gradient(90deg, #275ce4, #36ebff); transition: width 0.3s ease; }

    /* ---------- collapsed reopen tab ---------- */
    .nb-reopen { position: fixed; left: 0; top: 150px; display: flex; flex-direction: column; align-items: center; gap: 10px;
      border: none; border-radius: 0 12px 12px 0; padding: 16px 10px; cursor: pointer;
      background: #f6f8fd; color: #0b1541; font-family: 'Montserrat', sans-serif;
      font-size: 15px; font-weight: 700; letter-spacing: 0.02em; box-shadow: 4px 10px 30px rgba(11, 21, 65, 0.35); }
    .nb-reopen:hover { background: #eef2fe; }
    .nb-reopen-badge { width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #275ce4, #6c5ce7); color: #fff; }
    .nb-reopen-badge mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .nb-reopen-text { writing-mode: vertical-rl; transform: rotate(180deg); }

    .nb-reopen:focus-visible, .nb-collapse:focus-visible, .nb-item:focus-visible { outline: 2px solid #275ce4; outline-offset: 2px; }

    .nb-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

    @media (prefers-reduced-motion: reduce) { .nb-panel { animation: none; } }
  `]
})
export class NotebookChecklistComponent implements OnInit, OnDestroy {
  readonly milestones = MILESTONES;
  readonly total = MILESTONES.length;
  readonly holes = Array.from({ length: 8 });

  private readonly EXPANDED_KEY = 'investing_sim__notebook_expanded';

  private completed = new Set<MilestoneKey>();
  private currentUrl = '';
  private userExpanded = this.loadExpanded();
  private hasRoom = true;
  private isBrowserMaximized = false;

  private sub = new Subscription();
  private mo?: MutationObserver;
  private readonly onResize = () => { this.updateRoom(); this.cdr.detectChanges(); };

  constructor(
    public svc: ChecklistService,
    private router: Router,
    private dataService: DataService,
    private walkthrough: WalkthroughService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.currentUrl = this.router.url;
    this.sub.add(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd))
        .subscribe(e => {
          this.currentUrl = (e as NavigationEnd).urlAfterRedirects;
          this.updateRoom();
          this.cdr.detectChanges();
        })
    );
    this.sub.add(this.svc.completed$.subscribe(set => { this.completed = set; this.cdr.detectChanges(); }));
    // Re-render when the walkthrough opens/closes a pop-up so we can step aside
    // (its spotlight callout can otherwise overlap the notebook on the left).
    this.sub.add(this.walkthrough.active$.subscribe(() => { this.syncBody(); this.cdr.detectChanges(); }));
    this.sub.add(this.walkthrough.expanded$.subscribe(() => { this.syncBody(); this.cdr.detectChanges(); }));

    window.addEventListener('resize', this.onResize);
    this.updateRoom();

    // Watch the faux-browser window's class so we can collapse when it is maximized.
    // Class-only + subtree catches the `.browser-window.maximized` toggle without
    // firing on every DOM insertion the way childList would.
    this.mo = new MutationObserver(() => { this.updateRoom(); this.cdr.detectChanges(); });
    this.mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
    this.mo?.disconnect();
    this.sub.unsubscribe();
    document.body.classList.remove('nb-panel-open');
  }

  get visible(): boolean {
    const onSim = this.currentUrl.startsWith('/investing') || this.currentUrl.startsWith('/banking');
    const browserLayout = this.dataService.getOptions().layout === 'web_browser';
    // Step aside while the walkthrough is showing a pop-up or spotlight callout;
    // it reappears once the guide is minimized to the coach bar or finished.
    const guideOpen = this.walkthrough.active && this.walkthrough.expanded;
    return onSim && browserLayout && !guideOpen;
  }

  /** Panel shows only when the student wants it AND there is room for it. */
  get showPanel(): boolean {
    return this.userExpanded && this.hasRoom;
  }

  get doneCount(): number { return this.completed.size; }

  isDone(key: MilestoneKey): boolean { return this.completed.has(key); }

  toggle(): void {
    this.userExpanded = !this.userExpanded;
    this.saveExpanded(this.userExpanded);
    this.syncBody();
  }

  private updateRoom(): void {
    this.isBrowserMaximized = !!document.querySelector('.browser-window.maximized');
    // Need enough width that shifting the browser window clear of the open panel
    // (see body.nb-panel-open in styles.scss) still leaves a usable window; below
    // this the panel collapses to the thin tab instead.
    this.hasRoom = !this.isBrowserMaximized && window.innerWidth >= 1100;
    this.syncBody();
  }

  /**
   * Mirror "the panel is actually on screen" onto a body class so the layout can
   * shift the browser window to the right of it, keeping page content from
   * scrolling underneath the fixed notebook.
   */
  private syncBody(): void {
    document.body.classList.toggle('nb-panel-open', this.visible && this.showPanel);
  }

  private loadExpanded(): boolean {
    try {
      const v = localStorage.getItem(this.EXPANDED_KEY);
      return v === null ? true : v === '1';
    } catch { return true; }
  }

  private saveExpanded(v: boolean): void {
    try { localStorage.setItem(this.EXPANDED_KEY, v ? '1' : '0'); } catch { /* ignore */ }
  }
}
