import { Component, Input, ElementRef, ViewChild, AfterViewInit, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

export interface LineSeries {
  label: string;
  data: number[];
  color?: string;
}

interface LegendItem {
  label: string;
  color: string;
  hidden: boolean;
}

/**
 * Single reusable Chart.js line chart. New charts (portfolio value, compare assets)
 * render through this rather than each re-implementing create/destroy/update.
 * The legend is custom (toggle chips) — Chart.js's built-in legend wraps long
 * labels into a jumble.
 */
@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-toolbar" *ngIf="labels.length && series.length">
      <button type="button" class="chart-toggle" (click)="showTable = !showTable" [attr.aria-pressed]="showTable">
        {{ showTable ? 'Show chart' : 'Show table' }}
      </button>
    </div>
    <div class="chart-legend" *ngIf="!showTable && showLegend && legendItems.length > 1">
      <button type="button"
              class="legend-chip"
              *ngFor="let item of legendItems; let i = index"
              [class.off]="item.hidden"
              (click)="toggleSeries(i)"
              [attr.aria-pressed]="!item.hidden"
              [attr.title]="item.hidden ? 'Show ' + item.label : 'Hide ' + item.label">
        <span class="chip-dot" [style.background]="item.color"></span>
        <span class="chip-label">{{ item.label }}</span>
      </button>
    </div>
    <div class="line-chart-wrap" [style.height.px]="height" [style.display]="showTable ? 'none' : 'block'"><canvas #canvas role="img" [attr.aria-label]="ariaLabel || yLabel"></canvas></div>
    <!-- Text equivalent of the plotted data (WCAG 1.1.1). Kept in the DOM even in
         chart mode (clipped via .sr-only) so assistive tech always has the data;
         the toggle reveals it visually for everyone. -->
    <div class="chart-table-wrap" [class.sr-only]="!showTable" [attr.tabindex]="showTable ? 0 : null" *ngIf="labels.length && series.length">
      <table class="chart-table">
        <caption>{{ ariaLabel || yLabel }} (data table)</caption>
        <thead>
          <tr><th scope="col">Period</th><th scope="col" *ngFor="let s of series">{{ s.label }}</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let label of labels; let i = index">
            <th scope="row">{{ label }}</th>
            <td *ngFor="let s of series">{{ formatValue(s.data[i]) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .line-chart-wrap { position: relative; width: 100%; }

    /* Visually hidden but exposed to assistive tech (data-table equivalent of the chart). */
    .sr-only {
      position: absolute;
      width: 1px; height: 1px;
      padding: 0; margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .chart-toolbar { display: flex; justify-content: flex-end; margin-bottom: 8px; }
    .chart-toggle {
      border: 1px solid #c5d9f1; background: #f5f9fe; color: #1f3b9b;
      border-radius: 16px; padding: 4px 14px; font-family: inherit; font-size: 0.8rem;
      font-weight: 600; cursor: pointer; transition: background 0.12s ease;
    }
    .chart-toggle:hover { background: #e8f0fb; }
    .chart-toggle:focus-visible { outline: 2px solid #275ce4; outline-offset: 2px; }

    .chart-table-wrap:not(.sr-only) { overflow-x: auto; }
    .chart-table-wrap:focus-visible { outline: 2px solid #275ce4; outline-offset: 2px; }
    table.chart-table { border-collapse: collapse; width: 100%; font-size: 0.85rem; }
    table.chart-table caption { text-align: left; font-weight: 600; color: #333; margin-bottom: 8px; }
    table.chart-table th, table.chart-table td {
      border: 1px solid #e0e0e0; padding: 6px 10px; text-align: right; white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    table.chart-table thead th { background: #f5f5f5; }
    table.chart-table th[scope="row"] { text-align: left; font-weight: 500; }

    .chart-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }

    .legend-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border: 1px solid #e0e0e0;
      border-radius: 16px;
      background: #fafafa;
      font-family: inherit;
      font-size: 0.8rem;
      color: #424242;
      cursor: pointer;
      transition: background 0.12s ease, opacity 0.12s ease;
      white-space: nowrap;
    }

    .legend-chip:hover {
      background: #eef4fc;
      border-color: #c5d9f1;
    }

    .legend-chip .chip-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex: none;
    }

    .legend-chip.off {
      opacity: 0.45;
    }

    .legend-chip.off .chip-label {
      text-decoration: line-through;
    }
  `]
})
export class LineChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() labels: string[] = [];
  @Input() series: LineSeries[] = [];
  @Input() yMax?: number;
  @Input() yLabel = 'Price ($)';
  @Input() showLegend = false;
  @Input() height = 280;
  @Input() valueFormat: 'currency' | 'percent' = 'currency';
  @Input() ariaLabel = '';

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  legendItems: LegendItem[] = [];
  showTable = false;

  private chart: Chart | null = null;
  private viewReady = false;
  private readonly palette = ['#275ce4', '#2e7d32', '#e65100', '#6a1b9a', '#c62828', '#00838f', '#5d4037', '#9e9d24'];

  constructor() {
    Chart.register(...registerables);
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.render();
  }

  ngOnChanges(): void {
    if (!this.viewReady) {
      return;
    }
    // Update in place when the series structure is unchanged — a full recreate
    // would flicker and reset the user's legend visibility toggles.
    if (this.chart && this.sameStructure()) {
      this.updateInPlace();
    } else {
      this.render();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  toggleSeries(index: number): void {
    if (!this.chart) {
      return;
    }
    const visible = this.chart.isDatasetVisible(index);
    this.chart.setDatasetVisibility(index, !visible);
    this.legendItems[index].hidden = visible;
    this.chart.update();
  }

  private seriesColor(s: LineSeries, i: number): string {
    return s.color || this.palette[i % this.palette.length];
  }

  /** Format a value for the visually-hidden data table, matching the chart tooltip. */
  formatValue(v: number | undefined): string {
    if (v == null || Number.isNaN(v)) { return ''; }
    return this.valueFormat === 'percent'
      ? `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
      : `$${v.toFixed(2)}`;
  }

  private sameStructure(): boolean {
    const datasets = this.chart!.data.datasets;
    return datasets.length === this.series.length &&
      datasets.every((d, i) => d.label === this.series[i].label);
  }

  private updateInPlace(): void {
    const chart = this.chart!;
    chart.data.labels = this.labels;
    this.series.forEach((s, i) => {
      chart.data.datasets[i].data = s.data;
    });
    const yScale: any = (chart.options.scales as any)?.['y'];
    if (yScale) {
      yScale.max = this.yMax;
      yScale.beginAtZero = this.yMax != null;
    }
    chart.update();
  }

  private render(): void {
    if (!this.canvasRef) {
      return;
    }
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const single = this.series.length === 1;
    const datasets = this.series.map((s, i) => {
      const color = this.seriesColor(s, i);
      return {
        label: s.label,
        data: s.data,
        borderColor: color,
        backgroundColor: single ? 'rgba(25, 118, 210, 0.1)' : color,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.2,
        fill: single
      };
    });

    this.legendItems = this.series.map((s, i) => ({
      label: s.label,
      color: this.seriesColor(s, i),
      hidden: false
    }));

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'line',
      data: { labels: this.labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          // Built-in legend replaced by the custom chip legend above the chart.
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = Number(ctx.parsed.y);
                return this.valueFormat === 'percent'
                  ? `${ctx.dataset.label}: ${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
                  : `${ctx.dataset.label}: $${v.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          x: { display: true, ticks: { maxRotation: 0, autoSkip: true } },
          y: {
            display: true,
            title: { display: true, text: this.yLabel },
            beginAtZero: this.yMax != null,
            max: this.yMax
          }
        }
      }
    });
  }
}
