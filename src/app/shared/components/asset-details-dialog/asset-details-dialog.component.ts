import { Component, Inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Chart, registerables } from 'chart.js';
import { MONTHS_SHORT } from '../../pipes/evergreen-date.pipe';
import { DataService } from '../../services/data.service';
import { CurrentDateService } from '../../services/current-date.service';
import { getQuarterForDate, getPreviousQuarter } from '../../data/quarters.data';
import { AssetTypePipe } from '../../pipes/asset-type.pipe';
import { DefineComponent } from '../define/define.component';

export interface AssetDetailsDialogData {
  asset: any;
  currentDate: string;
}

@Component({
  selector: 'app-asset-details-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatCardModule, MatIconModule, AssetTypePipe, DefineComponent],
  templateUrl: './asset-details-dialog.component.html',
  styleUrl: './asset-details-dialog.component.scss'
})
export class AssetDetailsDialogComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('priceChartCanvas', { static: false }) priceChartCanvas!: ElementRef<HTMLCanvasElement>;
  
  asset: any;
  currentDate: string = '';
  currentPrice: number = 0;
  private priceChart: Chart | null = null;

  constructor(
    public dialogRef: MatDialogRef<AssetDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssetDetailsDialogData,
    private dataService: DataService,
    private currentDateService: CurrentDateService
  ) {
    Chart.register(...registerables);
    this.asset = data.asset;
    this.currentDate = data.currentDate;
  }

  ngOnInit(): void {
    this.currentPrice = this.getCurrentPrice();
  }

  /** Glossary key for the asset's type, so the Type value can show a hover definition. */
  typeTermKey(): string {
    const map: { [k: string]: string } = {
      stock: 'Stock',
      etf: 'ETF',
      mutual_fund: 'Mutual fund',
      target_date_fund: 'Target-date fund',
      bond_fund: 'Bond fund',
    };
    return map[this.asset?.type] || '';
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializePriceChart();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.priceChart) {
      this.priceChart.destroy();
      this.priceChart = null;
    }
  }

  /** Close and signal the caller to open the trade dialog preset to this asset. */
  buy(): void {
    this.dialogRef.close({ buy: true, assetId: this.asset?.id });
  }

  close(): void {
    this.dialogRef.close();
  }

  getCurrentPrice(): number {
    if (!this.asset || !this.asset.historicalPerformance) return 0;
    
    const currentPerformancePoint = this.asset.historicalPerformance
      .filter((point: any) => point.date <= this.currentDate)
      .sort((a: any, b: any) => b.date.localeCompare(a.date))[0];
    
    return currentPerformancePoint ? currentPerformancePoint.value : 0;
  }

  /**
   * Percent change over the previous quarter, matching the Daily Movers card on
   * the Overview (quarter start vs. previous quarter start), so the two views
   * always show the same number for the same asset.
   */
  getPriceChange(): number {
    if (!this.asset?.historicalPerformance) { return 0; }
    const currentQuarter = getQuarterForDate(this.currentDate);
    if (!currentQuarter) { return 0; }
    const previousQuarter = getPreviousQuarter(currentQuarter.value);
    if (!previousQuarter) { return 0; }

    const priceOn = (date: string) =>
      this.asset.historicalPerformance.find((p: any) => p.date === date);
    const cur = priceOn(currentQuarter.value);
    const prev = priceOn(previousQuarter.value);
    if (!cur || !prev) { return 0; }

    return ((cur.value - prev.value) / prev.value) * 100;
  }

  private initializePriceChart(): void {
    if (!this.priceChartCanvas) {
      return;
    }

    // Destroy existing chart if it exists
    if (this.priceChart) {
      this.priceChart.destroy();
    }

    // Get admin options for Y-axis scaling
    const adminOptions = this.dataService.getOptions();
    const useConsistentYAxis = adminOptions.lineGraphYAxis === 'consistent';

    this.priceChart = new Chart(this.priceChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Price',
          data: [],
          borderColor: '#275ce4',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Price: $${context.parsed.y.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Price ($)'
            },
            beginAtZero: useConsistentYAxis,
            max: useConsistentYAxis ? this.getMaxPriceAcrossAllAssets() : undefined
          }
        }
      }
    });

    this.updatePriceChart();
  }

  private updatePriceChart(): void {
    if (!this.priceChart || !this.asset) {
      return;
    }

    // Get historical data up to current date, limited to last 12 months
    const currentDateObj = new Date(this.currentDate);
    const twelveMonthsAgo = new Date(currentDateObj);
    twelveMonthsAgo.setMonth(currentDateObj.getMonth() - 12);
    const twelveMonthsAgoString = twelveMonthsAgo.toISOString().split('T')[0];
    
    const historicalData = this.asset.historicalPerformance
      .filter((point: any) => point.date <= this.currentDate && point.date >= twelveMonthsAgoString)
      .sort((a: any, b: any) => a.date.localeCompare(b.date));

    const labels = historicalData.map((point: any) => {
      // Format date string as "MM/YYYY" for monthly display
      const [year, month] = point.date.split('-');
      return MONTHS_SHORT[parseInt(month) - 1];
    });
    const data = historicalData.map((point: any) => point.value);

    // Get admin options for Y-axis scaling
    const adminOptions = this.dataService.getOptions();
    const useConsistentYAxis = adminOptions.lineGraphYAxis === 'consistent';

    this.priceChart.data.labels = labels;
    this.priceChart.data.datasets[0].data = data;

    // Update Y-axis settings
    if (this.priceChart.options && this.priceChart.options.scales && this.priceChart.options.scales['y']) {
      const yAxis = this.priceChart.options.scales['y'] as any;
      yAxis.beginAtZero = useConsistentYAxis;
      yAxis.max = useConsistentYAxis ? this.getMaxPriceAcrossAllAssets() : undefined;
    }

    this.priceChart.update();
  }

  private getMaxPriceAcrossAllAssets(): number {
    let maxPrice = 0;
    
    for (const asset of this.dataService.assets) {
      for (const point of asset.historicalPerformance) {
        if (point.value > maxPrice) {
          maxPrice = point.value;
        }
      }
    }
    
    return maxPrice;
  }
}

