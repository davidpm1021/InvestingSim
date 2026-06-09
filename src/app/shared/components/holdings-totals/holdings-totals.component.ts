import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { HoldingsService } from '../../services/holdings.service';
import { DataService } from '../../services/data.service';
import { CurrentDateService } from '../../services/current-date.service';
import { SIM_YEAR_START } from '../../data/quarters.data';

type PerfRange = '1M' | '3M' | 'YTD' | 'All';

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

  readonly ranges: Array<{ key: PerfRange; label: string }> = [
    { key: '1M', label: '1M' },
    { key: '3M', label: '3M' },
    { key: 'YTD', label: 'YTD' },
    { key: 'All', label: 'All' }
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
      case 'YTD': return 'Year to Date';
      default: return 'All Time';
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
      current += holding.shares * this.holdingsService.getCurrentPrice(asset, this.currentDate);
      previous += holding.shares * this.holdingsService.getCurrentPrice(asset, startDate);
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
    if (this.range === 'All') return '2024-01-01';
    const d = new Date(this.currentDate + 'T00:00:00');
    d.setMonth(d.getMonth() - (this.range === '1M' ? 1 : 3));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
