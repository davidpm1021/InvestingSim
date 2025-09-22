import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { HoldingsService } from '../../services/holdings.service';
import { DataService } from '../../services/data.service';
import { CurrentDateService } from '../../services/current-date.service';

@Component({
  selector: 'app-holdings-totals',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './holdings-totals.component.html',
  styleUrl: './holdings-totals.component.scss'
})
export class HoldingsTotalsComponent implements OnInit, OnDestroy {
  @Input() hideTotalValue: boolean = false;
  
  holdings: any[] = [];
  holdingsValue: number = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private holdingsService: HoldingsService,
    private dataService: DataService,
    private currentDateService: CurrentDateService
  ) {}

  ngOnInit(): void {
    // Subscribe to holdings and current date changes
    combineLatest([
      this.holdingsService.holdings$,
      this.currentDateService.currentDate$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([holdings, currentDate]) => {
      this.holdings = holdings;
      this.calculateHoldingsValue(currentDate);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private calculateHoldingsValue(currentDate: string): void {
    let totalValue = 0;
    for (const holding of this.holdings) {
      const asset = this.dataService.getAssetById(holding.assetId);
      if (asset) {
        const currentPrice = this.holdingsService.getCurrentPrice(asset, currentDate);
        totalValue += holding.shares * currentPrice;
      }
    }
    this.holdingsValue = totalValue;
  }

  // Get 90-day performance for holdings overview
  get90DayPerformance(): { percentage: number, amount: number } {
    if (this.holdings.length === 0) {
      return { percentage: 0, amount: 0 };
    }

    const currentDate = this.currentDateService.getCurrentDate();
    let totalCurrentValue = 0;
    let totalPreviousValue = 0;

    for (const holding of this.holdings) {
      const asset = this.dataService.getAssetById(holding.assetId);
      if (!asset) continue;

      // Get current price
      const currentPrice = this.holdingsService.getCurrentPrice(asset, currentDate);
      const currentValue = holding.shares * currentPrice;
      totalCurrentValue += currentValue;

      // Get price from 90 days ago (approximately 3 months)
      const currentDateObj = new Date(currentDate);
      const ninetyDaysAgo = new Date(currentDateObj);
      ninetyDaysAgo.setDate(currentDateObj.getDate() - 90);
      const ninetyDaysAgoString = ninetyDaysAgo.toISOString().split('T')[0];

      // Find the closest price point to 90 days ago
      const previousPerformancePoint = asset.historicalPerformance
        .filter((point: any) => point.date <= ninetyDaysAgoString)
        .sort((a: any, b: any) => b.date.localeCompare(a.date))[0];

      if (previousPerformancePoint) {
        const previousValue = holding.shares * previousPerformancePoint.value;
        totalPreviousValue += previousValue;
      } else {
        // If no historical data for 90 days ago, use current value (no change)
        totalPreviousValue += currentValue;
      }
    }

    if (totalPreviousValue === 0) {
      return { percentage: 0, amount: 0 };
    }

    const percentageChange = ((totalCurrentValue - totalPreviousValue) / totalPreviousValue) * 100;
    const amountChange = totalCurrentValue - totalPreviousValue;

    return {
      percentage: percentageChange,
      amount: amountChange
    };
  }
}
