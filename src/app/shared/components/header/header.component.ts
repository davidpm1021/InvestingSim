import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DataService } from '../../services/data.service';
import { CurrentDateService } from '../../services/current-date.service';

interface QuarterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  selectedQuarter: string = '2025-01-01';
  quarterOptions: QuarterOption[] = [];
  private subscription = new Subscription();

  constructor(private dataService: DataService, private currentDateService: CurrentDateService) {}

  ngOnInit(): void {
    // Get quarter options from current date service
    this.quarterOptions = this.currentDateService.getQuarterOptions();
    
    // Subscribe to current date changes
    this.subscription.add(
      this.currentDateService.currentDate$.subscribe(date => {
        this.selectedQuarter = date;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onQuarterChange(selectedValue: string): void {
    this.currentDateService.setCurrentDate(selectedValue);
    console.log('Selected quarter:', this.currentDateService.getQuarterLabel(selectedValue), 'Date:', selectedValue);
  }

  onReset(): void {
    // Clear all localStorage keys
    localStorage.clear();
    
    // Reload the page
    window.location.reload();
  }
}
