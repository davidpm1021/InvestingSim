import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DataService } from '../../services/data.service';
import { CurrentDateService } from '../../services/current-date.service';
import { TransactionsService } from '../../services/transactions.service';
import { QuarterNavigationDialogComponent, QuarterNavigationDialogData } from '../quarter-navigation-dialog/quarter-navigation-dialog.component';

interface QuarterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule, MatDialogModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  selectedQuarter: string = '2025-01-01';
  quarterOptions: QuarterOption[] = [];
  currentQuarterLabel: string = 'Quarter 1';
  nextQuarterLabel: string = '';
  canNavigateToNext: boolean = false;
  private subscription = new Subscription();

  constructor(
    private dataService: DataService, 
    private currentDateService: CurrentDateService,
    private transactionsService: TransactionsService,
    private router: Router,
    private dialog: MatDialog
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
  }
  
  updateQuarterInfo(): void {
    this.currentQuarterLabel = this.currentDateService.getQuarterLabel(this.selectedQuarter);
    
    // Find the current quarter index and next quarter
    const currentIndex = this.quarterOptions.findIndex(option => option.value === this.selectedQuarter);
    
    if (currentIndex >= 0 && currentIndex < this.quarterOptions.length - 1) {
      const nextQuarter = this.quarterOptions[currentIndex + 1];
      this.nextQuarterLabel = nextQuarter.label;
      // Hide button at Quarter 4 (index 3) or Final Review
      this.canNavigateToNext = currentIndex < 3; // Quarter 4 is at index 3
    } else {
      this.nextQuarterLabel = '';
      this.canNavigateToNext = false;
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onQuarterChange(selectedValue: string): void {
    this.currentDateService.setCurrentDate(selectedValue);
    console.log('Selected quarter:', this.currentDateService.getQuarterLabel(selectedValue), 'Date:', selectedValue);
  }

  onReset(): void {
    // Clear all transactions first
    this.transactionsService.clearAllTransactions();
    
    // Clear only investing_sim__ localStorage keys
    const keysToRemove = [
      'investing_sim__admin_options',
      'investing_sim__current_date', 
      'investing_sim__holding_transactions',
      'investing_sim__transactions'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Reload the page
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
        // Find the next quarter value and navigate to it
        const currentIndex = this.quarterOptions.findIndex(option => option.value === this.selectedQuarter);
        if (currentIndex >= 0 && currentIndex < this.quarterOptions.length - 1) {
          const nextQuarter = this.quarterOptions[currentIndex + 1];
          this.currentDateService.setCurrentDate(nextQuarter.value);
        }
      }
    });
  }
}
