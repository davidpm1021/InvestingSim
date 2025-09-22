import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService, AdminOptions } from '../../shared/services/data.service';
import { AssetTypePipe } from '../../shared/pipes/asset-type.pipe';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
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

  // Asset performance data
  allAssets: any[] = [];
  selectedAsset: any = null;
  selectedAssetPerformanceData: any[] = [];
  groupedAssets: any[] = [];
  
  // Chart.js
  @ViewChild('performanceChartCanvas', { static: false }) performanceChartCanvas!: ElementRef<HTMLCanvasElement>;
  private performanceChart: Chart | null = null;

  constructor(
    private dataService: DataService,
    private router: Router
  ) {
    // Register Chart.js components
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.loadOptions();
    this.loadAssets();
  }

  ngAfterViewInit(): void {
    // Chart initialization will happen when asset is selected
  }

  onTabChange(event: any): void {
    console.log('Admin tab change:', event.index);
    console.log('allAssets length:', this.allAssets?.length);
    console.log('selectedAsset:', this.selectedAsset);
    
    // If switching to Asset Performance tab (index 1) and no asset is selected, select the first one
    if (event.index === 1 && !this.selectedAsset && this.allAssets && this.allAssets.length > 0) {
      console.log('Auto-selecting first asset:', this.allAssets[0]);
      this.selectAsset(this.allAssets[0]);
    }
  }

  ngOnDestroy(): void {
    // Destroy chart to prevent memory leaks
    if (this.performanceChart) {
      this.performanceChart.destroy();
      this.performanceChart = null;
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
    // Redirect to home and force a full browser refresh
    window.location.href = '/home';
  }

  getOptions(): AdminOptions {
    return this.adminOptions;
  }

  private loadAssets(): void {
    console.log('Loading assets...');
    this.allAssets = this.dataService.assets;
    this.groupedAssets = this.getAssetsByType();
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
    // Format date string directly: "2024-10-01" -> "10/1/2024"
    const [year, month, day] = dateString.split('-');
    return `${parseInt(month)}/${parseInt(day)}/${year}`;
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
          borderColor: '#1976d2',
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
}
