import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { HoldingsService } from '../../services/holdings.service';
import { DataService } from '../../services/data.service';
import { CurrentDateService } from '../../services/current-date.service';
import { SIM_YEAR_START } from '../../data/quarters.data';

type PerfRange = '1M' | '3M' | 'YTD';

@Component({
  selector: 'app-holdings-totals',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonToggleModule],
  templateUrl: './holdings-totals.component.html',
  styleUrl: './holdings-totals.component.scss'
})
export class HoldingsTotalsComponent implements OnInit, OnDestroy {
  @Input() hideTotalValue = false;

  holdings: any[] = [];
  holdingsValue = 0;
  range: PerfRange = 'YTD';
  performance = { percentage: 0, amount: 0 };

  // No "All" range: the simulation only ever covers one year, so YTD already spans
  // everything the student could have owned. "All" measured from the start of the
  // price data (a year before the sim begins), reporting a change from before they
  // held anything, which read as a contradiction next to YTD.
  readonly ranges: Array<{ key: PerfRange; label: string }> = [
    { key: '1M', label: '1M' },
    { key: '3M', label: '3M' },
    { key: 'YTD', label: 'YTD' }
  ];

  private readonly YEAR_START = SIM_YEAR_START;
  private currentDate = '2025-01-01';
  private destroy$ = new Subject<void>();

  constructor(
    private holdingsService: HoldingsService,
    private dataService: DataService,
    private currentDateService: CurrentDateService
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.holdingsService.holdings$,
      this.currentDateService.currentDate$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([holdings, currentDate]) => {
      this.holdings = holdings;
      this.currentDate = currentDate;
      this.calculateHoldingsValue();
      this.recomputePerformance();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setRange(range: PerfRange): void {
    this.range = range;
    this.recomputePerformance();
  }

  rangeLabel(): string {
    switch (this.range) {
      case '1M': return 'Past Month';
      case '3M': return 'Past 3 Months';
      default: return 'Year to Date';
    }
  }

  private calculateHoldingsValue(): void {
    // holdings$ already prices each holding at the current date — just sum.
    this.holdingsValue = this.holdings.reduce((sum, h) => sum + h.value, 0);
  }

  // Mark-to-market return on current holdings over the selected window.
  private recomputePerformance(): void {
    if (this.holdings.length === 0) {
      this.performance = { percentage: 0, amount: 0 };
      return;
    }
    const startDate = this.windowStart();
    let current = 0;
    let previous = 0;
    for (const holding of this.holdings) {
      const asset = this.dataService.getAssetById(holding.assetId);
      if (!asset) continue;
      const cur = holding.shares * this.holdingsService.getCurrentPrice(asset, this.currentDate);
      // If the asset has no price on or before the window start, getCurrentPrice can only
      // return a forward/fallback price; treat that holding as 0% change for the window
      // (use its current value as the baseline) rather than inventing a return.
      const hasStartPrice = asset.historicalPerformance.some((p: any) => p.date <= startDate);
      const prev = hasStartPrice
        ? holding.shares * this.holdingsService.getCurrentPrice(asset, startDate)
        : cur;
      current += cur;
      previous += prev;
    }
    if (previous === 0) {
      this.performance = { percentage: 0, amount: 0 };
      return;
    }
    this.performance = {
      percentage: ((current - previous) / previous) * 100,
      amount: current - previous
    };
  }

  private windowStart(): string {
    if (this.range === 'YTD') return this.YEAR_START;
    const months = this.range === '1M' ? 1 : 3;
    const d = new Date(this.currentDate + 'T00:00:00');
    const dayOfMonth = d.getDate();
    // Step the month from the 1st to avoid the setMonth day-overflow (e.g. Mar 31 minus
    // one month is not Feb 31), then clamp the day to the target month's length.
    d.setDate(1);
    d.setMonth(d.getMonth() - months);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(dayOfMonth, lastDay));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
