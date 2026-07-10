import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService, AdminOptions } from '../../shared/services/data.service';
import { CurrentDateService } from '../../shared/services/current-date.service';
import { MONTHS_SHORT } from '../../shared/pipes/evergreen-date.pipe';
import { AssetTypePipe } from '../../shared/pipes/asset-type.pipe';
import { Chart, registerables } from 'chart.js';
import assetsData from '../../shared/data/assets.json';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    AssetTypePipe
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly OPTIONS_KEY = 'investing_sim__admin_options';
  
  // Options
  adminOptions: AdminOptions = {
    lineGraphYAxis: 'dynamic',
    layout: 'default'
  };

  // Dropdown options
  yAxisOptions = [
    { value: 'consistent', label: 'Consistent Y-Axis' },
    { value: 'dynamic', label: 'Dynamic Y-Axis' }
  ];

  layoutOptions = [
    { value: 'default', label: 'Default Layout' },
    { value: 'web_browser', label: 'Web Browser Layout' }
  ];

  // Teacher quarter override
  quarterOptions: { label: string; value: string }[] = [];
  selectedQuarterValue = '';

  // Asset performance data
  allAssets: any[] = [];
  selectedAsset: any = null;
  selectedAssetPerformanceData: any[] = [];
  groupedAssets: any[] = [];
  
  // JSON data for display
  assetsJsonString: string = '';
  
  // Chart.js
  @ViewChild('performanceChartCanvas', { static: false }) performanceChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('allAssetsChart', { static: false }) allAssetsChartCanvas!: ElementRef<HTMLCanvasElement>;
  private performanceChart: Chart | null = null;
  private allAssetsChart: Chart | null = null;

  constructor(
    private dataService: DataService,
    private router: Router,
    private currentDateService: CurrentDateService
  ) {
    // Register Chart.js components
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.loadOptions();
    this.loadAssets();
    this.quarterOptions = this.currentDateService.getQuarterOptions();
    this.selectedQuarterValue = this.currentDateService.getCurrentDate();
  }

  onSetQuarter(value: string): void {
    this.currentDateService.setCurrentDate(value);
    this.selectedQuarterValue = value;
  }

  ngAfterViewInit(): void {
    // Chart initialization will happen when asset is selected
  }

  onTabChange(event: any): void {
    console.log('Admin tab change:', event.index);
    console.log('allAssets length:', this.allAssets?.length);
    console.log('selectedAsset:', this.selectedAsset);
    
    // No auto-selection - let user manually select an asset
  }

  onInnerTabChange(event: any): void {
    console.log('Inner tab change:', event.index);
    // Initialize all assets chart when "All Assets" tab is selected (index 1)
    if (event.index === 1) {
      setTimeout(() => {
        this.initializeAllAssetsChart();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    // Destroy charts to prevent memory leaks
    if (this.performanceChart) {
      this.performanceChart.destroy();
      this.performanceChart = null;
    }
    if (this.allAssetsChart) {
      this.allAssetsChart.destroy();
      this.allAssetsChart = null;
    }
  }

  private loadOptions(): void {
    this.adminOptions = this.dataService.getOptions();
  }

  private saveOptions(): void {
    // Save directly to localStorage without updating the DataService
    // This prevents immediate layout changes and avoids flicker
    localStorage.setItem(this.OPTIONS_KEY, JSON.stringify(this.adminOptions));
  }

  onYAxisChange(): void {
    this.saveOptions();
    // Force a full browser refresh to apply the Y-axis change
    window.location.href = window.location.href;
  }

  onLayoutChange(): void {
    this.saveOptions();
    // Redirect to the brokerage and force a full browser refresh
    window.location.href = '/investing';
  }

  getOptions(): AdminOptions {
    return this.adminOptions;
  }

  private loadAssets(): void {
    console.log('Loading assets...');
    this.allAssets = this.dataService.assets;
    this.groupedAssets = this.getAssetsByType();
    // Generate JSON string from the imported JSON data
    this.assetsJsonString = JSON.stringify(assetsData, null, 2);
    console.log('Loaded assets:', this.allAssets.length);
    console.log('First asset:', this.allAssets[0]);
    console.log('Grouped assets:', this.groupedAssets.length);
  }

  getAssetsByType(): any[] {
    const groupedAssets: { [key: string]: any[] } = {};
    
    // Group assets by type
    this.allAssets.forEach(asset => {
      if (!groupedAssets[asset.type]) {
        groupedAssets[asset.type] = [];
      }
      groupedAssets[asset.type].push(asset);
    });
    
    // Convert to array and sort by type name
    return Object.keys(groupedAssets)
      .sort()
      .map(type => ({
        type: type,
        assets: groupedAssets[type].sort((a, b) => a.name.localeCompare(b.name))
      }));
  }

  selectAsset(asset: any): void {
    console.log('selectAsset called with:', asset);
    this.selectedAsset = asset;
    
    // Cache the performance data to avoid recalculating on every change detection
    this.selectedAssetPerformanceData = this.getPerformanceData(asset);
    console.log('Cached performance data:', this.selectedAssetPerformanceData);
    
    // Initialize and update performance chart
    setTimeout(() => {
      console.log('Initializing performance chart...');
      this.initializePerformanceChart();
      this.updatePerformanceChart();
    }, 100);
  }

  getPerformanceData(asset: any): any[] {
    if (!asset || !asset.historicalPerformance) return [];
    
    return asset.historicalPerformance
      .sort((a: any, b: any) => a.date.localeCompare(b.date))
      .map((point: any, index: number) => {
        let gainLoss = 0;
        if (index > 0) {
          const previousValue = asset.historicalPerformance[index - 1].value;
          gainLoss = ((point.value - previousValue) / previousValue) * 100;
        }
        
        return {
          date: point.date,
          value: point.value,
          gainLoss: gainLoss
        };
      });
  }

  formatDate(dateString: string): string {
    // Format date string as "MM/YYYY" for monthly display
    const [year, month] = dateString.split('-');
    return MONTHS_SHORT[parseInt(month) - 1];
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

  private initializePerformanceChart(): void {
    console.log('initializePerformanceChart called');
    console.log('performanceChartCanvas:', this.performanceChartCanvas);
    
    if (!this.performanceChartCanvas) {
      console.log('No performanceChartCanvas found');
      return;
    }

    // Destroy existing chart if it exists
    if (this.performanceChart) {
      console.log('Destroying existing chart');
      this.performanceChart.destroy();
    }

    // Get admin options for Y-axis scaling
    const adminOptions = this.dataService.getOptions();
    const useConsistentYAxis = adminOptions.lineGraphYAxis === 'consistent';

    this.performanceChart = new Chart(this.performanceChartCanvas.nativeElement, {
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
  }

  private updatePerformanceChart(): void {
    console.log('updatePerformanceChart called');
    console.log('performanceChart:', this.performanceChart);
    console.log('selectedAsset:', this.selectedAsset);
    
    if (!this.performanceChart || !this.selectedAsset) {
      console.log('Missing performanceChart or selectedAsset');
      return;
    }

    const performanceData = this.selectedAssetPerformanceData;
    console.log('performanceData:', performanceData);
    
    const labels = performanceData.map(point => this.formatDate(point.date));
    const data = performanceData.map(point => point.value);

    // Get admin options for Y-axis scaling
    const adminOptions = this.dataService.getOptions();
    const useConsistentYAxis = adminOptions.lineGraphYAxis === 'consistent';
    
    this.performanceChart.data.labels = labels;
    this.performanceChart.data.datasets[0].data = data;
    
    // Update Y-axis settings based on admin options
    if (this.performanceChart.options && this.performanceChart.options.scales && this.performanceChart.options.scales['y']) {
      const yAxis = this.performanceChart.options.scales['y'] as any;
      yAxis.beginAtZero = useConsistentYAxis;
      yAxis.max = useConsistentYAxis ? this.getMaxPriceAcrossAllAssets() : undefined;
    }
    
    this.performanceChart.update();
  }

  // Initialize all assets chart
  initializeAllAssetsChart(): void {
    if (!this.allAssetsChartCanvas || this.allAssets.length === 0) return;

    const ctx = this.allAssetsChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (this.allAssetsChart) {
      this.allAssetsChart.destroy();
    }

    // Prepare data for all assets
    // Get all unique dates from all assets and sort them
    const allDates = new Set<string>();
    this.allAssets.forEach(asset => {
      asset.historicalPerformance.forEach((perf: any) => {
        allDates.add(perf.date);
      });
    });
    
    const sortedDates = Array.from(allDates).sort();
    // Format dates as "MM/YYYY" for monthly display
    const labels = sortedDates.map(date => {
      const [year, month] = date.split('-');
      return MONTHS_SHORT[parseInt(month) - 1];
    });
    
    const datasets = this.allAssets.map((asset, index) => {
      const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
      ];
      
      // Sort historical performance by date and map to values in the same order as labels
      const sortedPerformance = asset.historicalPerformance
        .slice()
        .sort((a: any, b: any) => a.date.localeCompare(b.date));
      
      // Create a map of date to value for easy lookup
      const valueMap = new Map<string, number>();
      sortedPerformance.forEach((perf: any) => {
        valueMap.set(perf.date, perf.value);
      });
      
      // Map values in the same order as labels
      const data = sortedDates.map(date => valueMap.get(date) || null);
      
      return {
        label: asset.name,
        data: data,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        borderWidth: 2,
        fill: false,
        tension: 0.1
      };
    });

    this.allAssetsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12
              }
            }
          },
          title: {
            display: true,
            text: 'All Assets Performance Over Time'
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Quarter'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Price ($)'
            },
            beginAtZero: false
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }

  // Method to copy JSON to clipboard
  copyJsonToClipboard(): void {
    navigator.clipboard.writeText(this.assetsJsonString).then(() => {
      // You could add a toast notification here if you have one
      console.log('JSON copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy JSON to clipboard:', err);
    });
  }
}
