import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import { NotificationsService, AppNotification } from '../../services/notifications.service';
import { EvergreenDatePipe } from '../../pipes/evergreen-date.pipe';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DataService } from '../../services/data.service';
import { CurrentDateService } from '../../services/current-date.service';
import { TransactionsService } from '../../services/transactions.service';
import { QuarterNavigationDialogComponent, QuarterNavigationDialogData } from '../quarter-navigation-dialog/quarter-navigation-dialog.component';
import { CapstoneDialogComponent } from '../capstone-dialog/capstone-dialog.component';
import { isFinalQuarter } from '../../data/quarters.data';
import { WalkthroughService } from '../../services/walkthrough.service';

interface QuarterOption {
  label: string;
  value: string;
}

/** Sentinel notification link that reopens the Year-End Review capstone (not a route). */
const CAPSTONE_LINK = 'year-end-review';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule, MatDialogModule, MatSnackBarModule, MatBadgeModule, FormsModule, EvergreenDatePipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  selectedQuarter: string = '2025-01-01';
  quarterOptions: QuarterOption[] = [];
  currentQuarterLabel: string = 'Quarter 1';
  nextQuarterLabel: string = '';
  canNavigateToNext: boolean = false;
  // True while the guided walkthrough is running but hasn't reached its "Fast-forward a
  // quarter" step — keeps "Jump to Quarter" disabled so the student can't skip the guide.
  quarterJumpDisabled: boolean = false;
  // Dev/teacher-only header controls (Reset and Account/Admin). Hidden from students;
  // flip to true to bring them back for development or admin work.
  showDevControls: boolean = false;
  notifications: AppNotification[] = [];
  unreadCount: number = 0;
  private subscription = new Subscription();

  constructor(
    private dataService: DataService,
    private currentDateService: CurrentDateService,
    private transactionsService: TransactionsService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private notificationsService: NotificationsService,
    private walkthroughService: WalkthroughService
  ) {}

  ngOnInit(): void {
    // Get quarter options from current date service
    this.quarterOptions = this.currentDateService.getQuarterOptions();
    
    // Subscribe to current date changes
    this.subscription.add(
      this.currentDateService.currentDate$.subscribe(date => {
        this.selectedQuarter = date;
        this.updateQuarterInfo();
      })
    );
    
    // Initial update
    this.updateQuarterInfo();

    // Notifications (factual events only)
    this.subscription.add(
      this.notificationsService.notifications$.subscribe(list => {
        this.notifications = list;
        this.unreadCount = list.filter(n => !n.read).length;
      })
    );

    // Gate "Jump to Quarter" while the guided walkthrough is before its quarter-advance step.
    this.subscription.add(
      this.walkthroughService.quarterNavGated$.subscribe(gated => {
        this.quarterJumpDisabled = gated;
      })
    );
  }

  onNotificationsOpened(): void {
    this.notificationsService.markAllRead();
  }

  onNotificationClick(n: AppNotification): void {
    // The Year-End Review has no route; reopen the capstone summary instead, so it's
    // reachable again after the student closes it.
    if (n.link === CAPSTONE_LINK) {
      this.openCapstone();
      return;
    }
    if (n.link) {
      // navigateByUrl (not navigate([...])) so links with a query param, e.g.
      // '/investing?tab=statements', land on the right tab.
      this.router.navigateByUrl(n.link);
    }
  }

  /** Open the Year-End Review (capstone) summary dialog. */
  openCapstone(): void {
    this.dialog.open(CapstoneDialogComponent, { width: '640px', maxHeight: '90vh' });
  }
  
  updateQuarterInfo(): void {
    this.currentQuarterLabel = this.currentDateService.getQuarterLabel(this.selectedQuarter);
    
    // Find the current quarter index and next quarter
    const currentIndex = this.quarterOptions.findIndex(option => option.value === this.selectedQuarter);
    
    if (currentIndex >= 0 && currentIndex < this.quarterOptions.length - 1) {
      const nextQuarter = this.quarterOptions[currentIndex + 1];
      this.nextQuarterLabel = nextQuarter.label;
      // Show button for all quarters except Final Review (which is the last option)
      this.canNavigateToNext = true;
    } else {
      this.nextQuarterLabel = '';
      this.canNavigateToNext = false;
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onReset(): void {
    // Clear all transactions first
    this.transactionsService.clearAllTransactions();

    // Hard reset: wipe EVERY investing_sim__ key so the app reopens exactly like
    // a first-time student visiting the site (fresh storage) -- including the
    // guided walkthrough, onboarding, and first-visit callouts. Iterating by
    // prefix avoids a hardcoded list going stale as new keys are added.
    Object.keys(localStorage)
      .filter(key => key.startsWith('investing_sim__'))
      .forEach(key => localStorage.removeItem(key));

    // Full navigation to the app root (the desktop, where the Web Browser icon
    // lives), not a reload of the current page -- so a reset returns the student
    // to the very start, with fresh storage. baseURI honors any <base href>.
    window.location.href = document.baseURI;
  }

  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  onJumpToNextQuarter(): void {
    if (!this.canNavigateToNext || !this.nextQuarterLabel || this.quarterJumpDisabled) {
      return;
    }

    const dialogData: QuarterNavigationDialogData = {
      nextQuarterLabel: this.nextQuarterLabel
    };

    const dialogRef = this.dialog.open(QuarterNavigationDialogComponent, {
      width: '500px',
      data: dialogData,
      panelClass: 'quarter-navigation-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        const completedLabel = this.currentDateService.getQuarterLabel(this.selectedQuarter);
        const currentIndex = this.quarterOptions.findIndex(option => option.value === this.selectedQuarter);
        if (currentIndex >= 0 && currentIndex < this.quarterOptions.length - 1) {
          const nextQuarter = this.quarterOptions[currentIndex + 1];
          this.currentDateService.setCurrentDate(nextQuarter.value);
          this.router.navigate(['/investing']);
          if (isFinalQuarter(nextQuarter.value)) {
            // Reaching the Year-End Review — show the capstone summary, and leave a
            // notification that reopens it (it has no route of its own).
            this.notificationsService.add('Your Year-End Review is ready.', CAPSTONE_LINK, nextQuarter.value);
            this.openCapstone();
          } else {
            this.notificationsService.add(`Your ${completedLabel} statement is ready.`, '/investing?tab=statements', nextQuarter.value);
            this.snackBar.open(`Your ${completedLabel} statement is ready.`, 'View', { duration: 6000 })
              .onAction().subscribe(() => this.router.navigateByUrl('/investing?tab=statements'));
          }
        }
      }
    });
  }
}
