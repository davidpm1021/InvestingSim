import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DataService } from '../../shared/services/data.service';
import { CurrentDateService } from '../../shared/services/current-date.service';
import { getGuideForQuarter, GuideContent } from '../../shared/data/guide.data';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  // Static placeholder values
  portfolioValue: number = 100000;
  cashBalance: number = 25000;
  totalReturn: number = 5.25;
  currentDate: string = '2025-01-01';
  guideContent: GuideContent | null = null;
  private subscription = new Subscription();

  constructor(public dataService: DataService, public currentDateService: CurrentDateService) {}

  ngOnInit(): void {
    // Subscribe to current date changes
    this.subscription.add(
      this.currentDateService.currentDate$.subscribe(date => {
        this.currentDate = date;
        this.updateGuideContent();
      })
    );
    
    // Initial load
    this.updateGuideContent();
  }

  private updateGuideContent(): void {
    this.guideContent = getGuideForQuarter(this.currentDate);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
