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

interface QuarterOption {
  label: string;
  value: string;
}

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
    private notificationsService: NotificationsService
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
  }

  onNotificationsOpened(): void {
    this.notificationsService.markAllRead();
  }

  onNotificationClick(n: AppNotification): void {
    if (n.link) {
      this.router.navigate([n.link]);
    }
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

    // Reload into the brand-new-student state.
    window.location.reload();
  }

  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  onJumpToNextQuarter(): void {
    if (!this.canNavigateToNext || !this.nextQuarterLabel) {
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
            // Reaching the Year-End Review — show the capstone summary.
            this.notificationsService.add('Your Year-End Review is ready.', '/investing', nextQuarter.value);
            this.dialog.open(CapstoneDialogComponent, { width: '640px', maxHeight: '90vh' });
          } else {
            this.notificationsService.add(`Your ${completedLabel} statement is ready.`, '/investing', nextQuarter.value);
            this.snackBar.open(`Your ${completedLabel} statement is ready.`, 'View', { duration: 6000 })
              .onAction().subscribe(() => this.router.navigate(['/investing']));
          }
        }
      }
    });
  }
}
