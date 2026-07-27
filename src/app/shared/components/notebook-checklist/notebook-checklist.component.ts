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
      <!-- Collapsed: a small tab on the left edge -->
      <button *ngIf="!showPanel" type="button" class="nb-tab" (click)="toggle()"
              [attr.aria-expanded]="false" aria-label="Open your notebook checklist">
        <mat-icon class="nb-tab-icon" fontIcon="fa-book-open"></mat-icon>
        <span class="nb-tab-text">Notebook</span>
        <span class="nb-tab-count">{{ doneCount }}/{{ total }}</span>
      </button>

      <!-- Expanded: the notebook page -->
      <aside *ngIf="showPanel" class="nb-panel" aria-label="Notebook checklist">
        <div class="nb-spiral" aria-hidden="true">
          <span *ngFor="let h of holes"></span>
        </div>
        <div class="nb-paper">
          <div class="nb-head">
            <span class="nb-title" role="heading" aria-level="2">My Checklist</span>
            <button type="button" class="nb-collapse" (click)="toggle()"
                    [attr.aria-expanded]="true" aria-label="Collapse the notebook checklist">
              <mat-icon fontIcon="fa-chevron-left"></mat-icon>
            </button>
          </div>
          <ul class="nb-list">
            <li *ngFor="let m of milestones" class="nb-item" [class.done]="isDone(m.key)">
              <span class="nb-box" aria-hidden="true">
                <mat-icon *ngIf="isDone(m.key)" fontIcon="fa-check"></mat-icon>
              </span>
              <span class="nb-label">{{ m.label }}</span>
              <span class="nb-sr" *ngIf="isDone(m.key)"> - done</span>
            </li>
          </ul>
          <p class="nb-foot">{{ doneCount }} of {{ total }} done</p>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .nb-root { position: fixed; left: 0; top: 0; bottom: 0; z-index: 2400;
      pointer-events: none; font-family: 'Caveat', 'Comic Sans MS', cursive; }
    .nb-root > * { pointer-events: auto; }

    /* ---------- collapsed tab ---------- */
    .nb-tab {
      position: fixed; left: 0; top: 50%; transform: translateY(-50%);
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      border: none; padding: 12px 8px; cursor: pointer;
      background: #fdf6e3; border: 1px solid #e5d9b6; border-left: none;
      border-radius: 0 12px 12px 0; box-shadow: 3px 3px 10px rgba(0,0,0,0.18);
      color: #3a3320;
    }
    .nb-tab:hover { background: #fbefcf; }
    .nb-tab:focus-visible { outline: 2px solid #275ce4; outline-offset: 2px; }
    .nb-tab-icon { color: #7a6a3a; }
    .nb-tab-text { writing-mode: vertical-rl; transform: rotate(180deg);
      font-size: 1.15rem; font-weight: 700; letter-spacing: 0.5px; }
    .nb-tab-count { font-size: 1rem; font-weight: 700; color: #6b5d2f;
      font-family: 'Montserrat', sans-serif; }

    /* ---------- expanded notebook ---------- */
    .nb-panel {
      position: fixed; left: 14px; top: 172px; width: 236px; max-height: calc(100vh - 200px);
      display: flex; overflow: hidden;
      background: #fffdf5; border: 1px solid #e5d9b6; border-radius: 10px;
      box-shadow: 4px 6px 18px rgba(0,0,0,0.22);
      animation: nb-slide 0.22s cubic-bezier(0.2, 0.7, 0.3, 1);
    }
    @keyframes nb-slide { from { transform: translateX(-16px); opacity: 0; } to { transform: none; opacity: 1; } }

    /* spiral binding down the left edge */
    .nb-spiral {
      flex-shrink: 0; width: 22px; background: #f3ead0; border-right: 1px dashed #d8c88f;
      display: flex; flex-direction: column; align-items: center; justify-content: space-around;
      padding: 14px 0;
    }
    .nb-spiral span { width: 9px; height: 9px; border-radius: 50%;
      background: #fffdf5; box-shadow: inset 0 0 0 2px #cbb985; }

    .nb-paper {
      flex: 1; min-width: 0; padding: 12px 14px 14px; overflow-y: auto;
      /* faint ruled lines */
      background-image: repeating-linear-gradient(to bottom, transparent 0, transparent 31px, #e7edf3 31px, #e7edf3 32px);
      background-position: 0 6px;
    }
    .nb-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .nb-title { font-size: 1.5rem; font-weight: 700; color: #2b2a4a;
      text-decoration: underline; text-decoration-color: #b9c2e0; text-underline-offset: 3px; }
    .nb-collapse { border: none; background: transparent; cursor: pointer; color: #6b6b6b;
      line-height: 0; padding: 2px; border-radius: 6px; }
    .nb-collapse:hover { background: #eee7cf; color: #333; }
    .nb-collapse:focus-visible, .nb-item:focus-visible { outline: 2px solid #275ce4; outline-offset: 2px; }

    .nb-list { list-style: none; margin: 0; padding: 0; }
    .nb-item { display: flex; align-items: flex-start; gap: 9px; padding: 5px 0; min-height: 32px; }
    .nb-box {
      flex-shrink: 0; width: 20px; height: 20px; margin-top: 2px;
      border: 2px solid #4a4636; border-radius: 4px; background: #fff;
      display: flex; align-items: center; justify-content: center;
    }
    .nb-box mat-icon { font-size: 18px; width: 18px; height: 18px; color: #1b7a2f; }
    .nb-label { font-size: 1.28rem; line-height: 1.35; color: #23324a; }

    .nb-item.done .nb-box { background: #e6f4ea; border-color: #1b7a2f; }
    .nb-item.done .nb-label { color: #6a6a6a; text-decoration: line-through;
      text-decoration-color: #c0392b; text-decoration-thickness: 2px; }

    .nb-foot { margin: 8px 0 0; font-size: 1.05rem; color: #6b5d2f; text-align: right;
      font-family: 'Montserrat', sans-serif; }

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
