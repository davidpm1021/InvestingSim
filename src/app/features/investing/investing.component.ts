import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ElementRef, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule, MatTabGroup } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { Subscription, combineLatest } from 'rxjs';
import { DataService } from '../../shared/services/data.service';
import { TransactionsService, Transaction } from '../../shared/services/transactions.service';
import { HoldingsService } from '../../shared/services/holdings.service';
import { CurrentDateService } from '../../shared/services/current-date.service';
import { getQuarterForDate, getPreviousQuarter } from '../../shared/data/quarters.data';
import { TransferDialogComponent } from '../banking/transfer-dialog.component';
import { AssetTypePipe } from '../../shared/pipes/asset-type.pipe';
import { PlaceTradeComponent, TradeData } from './place-trade.component';
import { HoldingsTotalsComponent } from '../../shared/components/holdings-totals/holdings-totals.component';
import { StatementDialogComponent, StatementDialogData } from './statement-dialog.component';
import { AssetDetailsDialogComponent, AssetDetailsDialogData } from '../../shared/components/asset-details-dialog/asset-details-dialog.component';
import { Chart, registerables } from 'chart.js';
import { MainLayoutComponent } from '../../shared/layout/main-layout/main-layout.component';

export interface Holding {
  asset: string;
  shares: number;
  price: number;
  value: number;
  gainLoss: number;
  gainLossPercent: number;
}

@Component({
  selector: 'app-investing',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatDialogModule, MatExpansionModule, MatFormFieldModule, MatIconModule, MatInputModule, MatRadioModule, MatSelectModule, MatSlideToggleModule, MatTableModule, MatTabsModule, FormsModule, PlaceTradeComponent, AssetTypePipe, HoldingsTotalsComponent],
  templateUrl: './investing.component.html',
  styleUrl: './investing.component.scss'
})
export class InvestingComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('tabGroup') tabGroup!: MatTabGroup;
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChartCanvas', { static: false }) lineChartCanvas!: ElementRef<HTMLCanvasElement>;
  
  brokerageBalance: number = 0;
  bankingBalance: number = 0;
  holdingsValue: number = 0;
  currentDate: string = '2025-01-01';
  transactions: Array<Transaction & { runningBalance: number, displayDescription: string }> = [];
  
  // Holdings data from HoldingsService
  holdings: any[] = [];
  
  // Holding transactions for Activity tab
  holdingTransactions: any[] = [];
  
  // Asset type allocation percentages
  assetTypeAllocation: Array<{type: string, percentage: number, value: number}> = [];
  
  // Recent activity for dashboard (last 3 transactions)
  recentActivity: any[] = [];
  
  // All assets for daily movers
  allAssets: any[] = [];
  
  displayedColumns: string[] = ['asset', 'shares', 'price', 'value', 'gainLoss'];

  // Chart.js instances
  private chart: Chart | null = null;
  private lineChart: Chart | null = null;

  // Tab tracking
  isDashboardTab: boolean = true;
  isHoldingsTab: boolean = false;

  // Dynamic quarterly statements
  quarterlyStatements: any[] = [];
  
  private subscription = new Subscription();

  constructor(
    public dataService: DataService, 
    public transactionsService: TransactionsService, 
    public holdingsService: HoldingsService, 
    public currentDateService: CurrentDateService, 
    private dialog: MatDialog,
    @Optional() private mainLayout: MainLayoutComponent
  ) {
    // Register Chart.js components
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    // Initialize all assets for daily movers
    this.allAssets = this.dataService.assets;
    
    // Subscribe to current date
    this.subscription.add(
      this.currentDateService.currentDate$.subscribe(date => {
        this.currentDate = date;
        
        // Re-render line chart if we have a selected holding
        if (this.selectedHolding) {
          setTimeout(() => {
            this.initializeLineChart();
            this.updateLineChart();
          }, 100);
        }
      })
    );

    // Subscribe to account balance
    this.subscription.add(
      this.transactionsService.getCurrentBalance$('brokerage001').subscribe(balance => {
        this.brokerageBalance = balance;
        this.generateQuarterlyStatements();
      })
    );

    // Subscribe to banking balance
    this.subscription.add(
      this.transactionsService.getCurrentBalance$('banking001').subscribe(balance => {
        this.bankingBalance = balance;
      })
    );

    // Subscribe to transactions with running balances
    this.subscription.add(
      this.transactionsService.getTransactionsWithRunningBalance$('brokerage001').subscribe(transactions => {
        this.transactions = transactions;
      })
    );

    // Subscribe to holdings data
    this.subscription.add(
      this.holdingsService.holdings$.subscribe(holdings => {
        this.holdings = holdings;
        this.calculateAssetTypeAllocation();
        this.generateQuarterlyStatements();
      })
    );

    // Subscribe to holding transactions for Activity tab (filtered by current date)
    this.subscription.add(
      combineLatest([
        this.holdingsService.holdingTransactions$,
        this.currentDateService.currentDate$
      ]).subscribe(([transactions, currentDate]) => {
        // Filter transactions to only include those on or before current date
        const filteredTransactions = transactions.filter(transaction => 
          transaction.date <= currentDate
        );
        
        // Sort transactions in descending order by date (most recent first)
        const sortedTransactions = filteredTransactions.sort((a, b) => {
          // Sort by date descending, then by time descending for same date
          const dateComparison = b.date.localeCompare(a.date);
          if (dateComparison !== 0) {
            return dateComparison;
          }
          // If dates are the same, sort by time descending
          return b.time.localeCompare(a.time);
        });
        
        // Update full activity list
        this.holdingTransactions = sortedTransactions;
        
        // Update recent activity (last 3 transactions)
        this.recentActivity = sortedTransactions.slice(0, 3);
      })
    );
  }

  ngAfterViewInit(): void {
    // Initialize chart after view is ready (only if there are holdings)
    if (this.holdingsValue > 0 && this.holdings.length > 0) {
      this.initializeChart();
    }
  }

  onTabChange(event: any): void {
    console.log('Investing tab change:', event.index);
    console.log('selectedHolding:', this.selectedHolding);
    console.log('holdings length:', this.holdings?.length);
    
    // Update tab tracking
    this.isDashboardTab = event.index === 0; // Dashboard is the first tab (index 0)
    this.isHoldingsTab = event.index === 2; // Holdings is the third tab (index 2)
    
    // Update the fake URL in web browser layout
    if (this.mainLayout) {
      const tabNames = ['dashboard', 'place-trade', 'holdings', 'activity', 'profile', 'statements'];
      const tabName = tabNames[event.index] || '';
      this.mainLayout.updateInvestingTab(tabName);
    }
    
    // Re-initialize chart if switching to dashboard (only if there are holdings)
    if (this.isDashboardTab && this.holdingsValue > 0 && this.holdings.length > 0) {
      console.log('Switching to Dashboard - initializing pie chart');
      setTimeout(() => {
        this.initializeChart();
      }, 100);
    }
    
    // If switching to Holdings tab and no holding is selected, select the first one
    if (this.isHoldingsTab && !this.selectedHolding && this.holdings && this.holdings.length > 0) {
      console.log('Switching to Holdings - auto-selecting first holding');
      this.selectHolding(this.holdings[0]);
      // The selectHolding method will handle chart initialization
    } else if (this.isHoldingsTab && this.selectedHolding) {
      console.log('Switching to Holdings - re-initializing chart for existing holding');
      // Re-initialize line chart if switching to holdings and we already have a selected holding
      setTimeout(() => {
        this.initializeLineChart();
        this.updateLineChart();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    // Destroy charts to prevent memory leaks
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    if (this.lineChart) {
      this.lineChart.destroy();
      this.lineChart = null;
    }
  }

  private initializeChart(): void {
    if (!this.chartCanvas) return;
    
    // Don't initialize chart if there are no holdings
    if (this.holdingsValue === 0 || this.holdings.length === 0) {
      return;
    }

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    // Prepare chart data from asset type allocation
    const labels = this.assetTypeAllocation.map(item => 
      `${this.formatAssetType(item.type)} (${item.percentage.toFixed(1)}%)`
    );
    const data = this.assetTypeAllocation.map(item => item.percentage);
    const backgroundColors = [
      '#FF6384', // Red
      '#36A2EB', // Blue
      '#FFCE56', // Yellow
      '#4BC0C0', // Teal
      '#9966FF', // Purple
      '#FF9F40', // Orange
      '#FF6384', // Pink
      '#C9CBCF'  // Gray
    ];

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          tooltip: {
            displayColors: false,
            callbacks: {
              title: function() {
                return '';
              },
              label: function(context) {
                // Get the original asset type without percentage
                const originalLabel = context.label || '';
                // Extract just the asset type name (remove the percentage part)
                const assetTypeName = originalLabel.split(' (')[0];
                const percentage = context.parsed;
                return `${assetTypeName}: ${percentage.toFixed(1)}%`;
              }
            }
          }
        }
      }
    });
  }

  private updateChart(): void {
    if (!this.chart) return;

    // Update chart data
    const labels = this.assetTypeAllocation.map(item => 
      `${this.formatAssetType(item.type)} (${item.percentage.toFixed(1)}%)`
    );
    const data = this.assetTypeAllocation.map(item => item.percentage);
    const backgroundColors = [
      '#FF6384', // Red
      '#36A2EB', // Blue
      '#FFCE56', // Yellow
      '#4BC0C0', // Teal
      '#9966FF', // Purple
      '#FF9F40', // Orange
      '#FF6384', // Pink
      '#C9CBCF'  // Gray
    ];

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = data;
    this.chart.data.datasets[0].backgroundColor = backgroundColors.slice(0, labels.length);
    this.chart.update();
  }

  private formatAssetType(type: string): string {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  private getMaxPriceAcrossAllAssets(): number {
    let maxPrice = 0;
    
    // Iterate through all assets
    for (const asset of this.dataService.assets) {
      // Find the maximum price in this asset's historical performance
      for (const point of asset.historicalPerformance) {
        if (point.value > maxPrice) {
          maxPrice = point.value;
        }
      }
    }
    
    console.log('Max price across all assets:', maxPrice);
    return maxPrice;
  }

  private initializeLineChart(): void {
    console.log('initializeLineChart called');
    console.log('lineChartCanvas:', this.lineChartCanvas);
    console.log('isHoldingsTab:', this.isHoldingsTab);
    console.log('selectedHolding:', this.selectedHolding);
    
    if (!this.lineChartCanvas) {
      console.log('No lineChartCanvas found - chart will not initialize');
      return;
    }

    // Destroy existing line chart if it exists
    if (this.lineChart) {
      this.lineChart.destroy();
    }

    // Get admin options for Y-axis scaling
    const adminOptions = this.dataService.getOptions();
    const useConsistentYAxis = adminOptions.lineGraphYAxis === 'consistent';
    console.log('Admin options:', adminOptions);
    console.log('Use consistent Y-axis:', useConsistentYAxis);

    this.lineChart = new Chart(this.lineChartCanvas.nativeElement, {
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

  private updateLineChart(): void {
    console.log('updateLineChart called');
    console.log('lineChart:', this.lineChart);
    console.log('selectedHolding:', this.selectedHolding);
    
    if (!this.lineChart || !this.selectedHolding) {
      console.log('Missing lineChart or selectedHolding - chart will not update');
      return;
    }

    const asset = this.dataService.getAssetById(this.selectedHolding.assetId);
    console.log('asset:', asset);
    if (!asset) {
      console.log('No asset found for selectedHolding');
      return;
    }

    // Get historical data up to current date, limited to last 12 months
    const currentDateObj = new Date(this.currentDate);
    const twelveMonthsAgo = new Date(currentDateObj);
    twelveMonthsAgo.setMonth(currentDateObj.getMonth() - 12);
    const twelveMonthsAgoString = twelveMonthsAgo.toISOString().split('T')[0];
    
    const historicalData = asset.historicalPerformance
      .filter((point: any) => point.date <= this.currentDate && point.date >= twelveMonthsAgoString)
      .sort((a: any, b: any) => a.date.localeCompare(b.date));
    
    console.log('currentDate:', this.currentDate);
    console.log('twelveMonthsAgoString:', twelveMonthsAgoString);
    console.log('historicalData:', historicalData);

    const labels = historicalData.map((point: any) => {
      // Format date string as "MM/YYYY" for monthly display
      const [year, month] = point.date.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    });
    const data = historicalData.map((point: any) => point.value);
    
    console.log('labels:', labels);
    console.log('data:', data);

    // Get admin options for Y-axis scaling
    const adminOptions = this.dataService.getOptions();
    const useConsistentYAxis = adminOptions.lineGraphYAxis === 'consistent';
    
    this.lineChart.data.labels = labels;
    this.lineChart.data.datasets[0].data = data;
    
    // Update Y-axis settings based on admin options
    if (this.lineChart.options && this.lineChart.options.scales && this.lineChart.options.scales['y']) {
      const yAxis = this.lineChart.options.scales['y'] as any;
      yAxis.beginAtZero = useConsistentYAxis;
      yAxis.max = useConsistentYAxis ? this.getMaxPriceAcrossAllAssets() : undefined;
    }
    
    this.lineChart.update();
  }

  getTransactionAmount(transaction: Transaction & { runningBalance: number, displayDescription: string }): number {
    if (transaction.type === 'transfer') {
      // For transfers, show the amount from brokerage account's perspective
      if (transaction.account_from === 'brokerage001') {
        return -transaction.amount; // Money going out
      } else if (transaction.account_to === 'brokerage001') {
        return transaction.amount; // Money coming in
      }
    }
    return transaction.amount;
  }

  openWithdrawDialog(): void {
    const dialogRef = this.dialog.open(TransferDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: { 
        maxAmount: this.brokerageBalance,
        currentDate: this.currentDate,
        transferDirection: 'to-banking' as const,
        sourceBalance: this.brokerageBalance, // Investment account balance
        destinationBalance: this.bankingBalance // Bank account balance
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.amount > 0) {
            this.transactionsService.addTransferToBankingTransaction(result.amount, this.currentDate);
      }
    });
  }

  openAddFundsDialog(): void {
    const dialogRef = this.dialog.open(TransferDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: { 
        maxAmount: this.bankingBalance, // Use actual banking balance
        currentDate: this.currentDate,
        transferDirection: 'to-brokerage' as const,
        sourceBalance: this.bankingBalance, // Bank account balance
        destinationBalance: this.brokerageBalance // Investment account balance
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.amount > 0) {
            this.transactionsService.addTransferTransaction(result.amount, this.currentDate);
      }
    });
  }

  openStatementDialog(statement: any): void {
    const dialogRef = this.dialog.open(StatementDialogComponent, {
      width: '80%',
      maxWidth: '1200px',
      maxHeight: '90vh',
      data: { 
        quarter: statement,
        currentDate: this.currentDate
      } as StatementDialogData
    });
  }

  onSubmitTrade(tradeData: TradeData): void {
    console.log('Trade submitted:', tradeData);
    // TODO: Integrate with HoldingsService to process the trade
  }

  processTrade(tradeData: TradeData): void {
    console.log('Processing trade:', tradeData);
    
    // Get the asset and current price
    const asset = this.dataService.getAssetById(tradeData.assetId);
    if (!asset) {
      console.error('Asset not found:', tradeData.assetId);
      return;
    }
    
    const currentPrice = this.holdingsService.getCurrentPrice(asset, this.currentDate);
    if (currentPrice <= 0) {
      console.error('Invalid current price for asset:', tradeData.assetId, currentPrice);
      return;
    }
    
    // Add holding transaction
    this.holdingsService.addHoldingTransaction(
      tradeData.assetId,
      tradeData.action.toLowerCase() as 'buy' | 'sell',
      tradeData.shares,
      currentPrice,
      this.currentDate
    );
    
    // Add corresponding brokerage transaction using the new method
    this.transactionsService.addTradeTransaction(
      'brokerage001',
      tradeData.assetId,
      tradeData.action.toLowerCase() as 'buy' | 'sell',
      tradeData.shares,
      currentPrice,
      this.currentDate,
      asset.name,
      asset.type
    );
    
    console.log('Trade processed successfully');
  }

  // Get asset name for holding transaction
  getAssetName(assetId: string): string {
    const asset = this.dataService.getAssetById(assetId);
    return asset ? asset.name : assetId;
  }

  // Get asset type for holding transaction
  getAssetType(assetId: string): string {
    const asset = this.dataService.getAssetById(assetId);
    return asset ? asset.type : '';
  }

  // Get running balance for this asset up to this transaction
  getRunningBalance(transaction: any): number {
    // Calculate running balance for this asset up to this transaction
    const assetId = transaction.assetId;
    const transactionDate = transaction.date;
    const transactionTime = transaction.time;
    
    // Get all transactions for this asset up to and including this transaction
    const relevantTransactions = this.holdingTransactions
      .filter(t => 
        t.assetId === assetId && 
        (t.date < transactionDate || (t.date === transactionDate && t.time <= transactionTime))
      )
      .sort((a, b) => {
        const dateComparison = a.date.localeCompare(b.date);
        if (dateComparison !== 0) {
          return dateComparison;
        }
        return a.time.localeCompare(b.time);
      });
    
    // Calculate running balance
    let runningBalance = 0;
    for (const t of relevantTransactions) {
      if (t.action === 'buy') {
        runningBalance += t.shares;
      } else if (t.action === 'sell') {
        runningBalance -= t.shares;
      }
    }
    
    return Math.max(0, runningBalance); // Ensure we don't return negative shares
  }

  // Calculate asset type allocation percentages
  calculateAssetTypeAllocation(): void {
    // Get all asset types from the centralized service
    const allAssetTypes = this.dataService.getAllAssetTypes();
    
    // Initialize all types with 0 values
    const typeTotals: { [type: string]: number } = {};
    allAssetTypes.forEach(type => {
      typeTotals[type] = 0;
    });
    
    let totalValue = 0;

    // Calculate totals for holdings that exist
    for (const holding of this.holdings) {
      const asset = this.dataService.getAssetById(holding.assetId);
      if (asset) {
        const type = asset.type;
        typeTotals[type] += holding.value;
        totalValue += holding.value;
      }
    }

    // Set the total holdings value
    this.holdingsValue = totalValue;

    // Calculate percentages and create allocation array for all types
    this.assetTypeAllocation = Array.from(allAssetTypes)
      .map(type => ({
        type,
        value: typeTotals[type],
        percentage: totalValue > 0 ? (typeTotals[type] / totalValue) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending
    
    // Update chart if it exists and we're on dashboard tab and there are holdings
    if (this.chart && this.isDashboardTab && this.holdingsValue > 0) {
      this.updateChart();
    } else if (this.isDashboardTab && this.holdingsValue > 0) {
      // Re-initialize chart if we're on dashboard but chart doesn't exist and there are holdings
      setTimeout(() => {
        this.initializeChart();
      }, 100);
    } else if (this.chart && this.holdingsValue === 0) {
      // Destroy chart if holdings value becomes 0
      this.chart.destroy();
      this.chart = null;
    }
  }

  // Handle trade completion - navigate to Activity tab
  onTradeCompleted(): void {
    // Switch to Activity tab (index 2: Dashboard=0, Place Trade=1, Activity=2)
    this.tabGroup.selectedIndex = 2;
  }

  // Navigate to Activity tab from dashboard
  goToActivityTab(): void {
    // Switch to Activity tab (index 2: Dashboard=0, Place Trade=1, Activity=2)
    this.tabGroup.selectedIndex = 2;
    // Scroll to top of the container
    this.scrollToTop();
  }

  // Get current price for daily movers
  getCurrentPrice(asset: any): number {
    return this.holdingsService.getCurrentPrice(asset, this.currentDate);
  }

  // Get current price for a specific holding
  getCurrentPriceForHolding(holding: any): number {
    if (!holding) return 0;
    const asset = this.dataService.getAssetById(holding.assetId);
    if (!asset) return 0;
    return this.holdingsService.getCurrentPrice(asset, this.currentDate);
  }

  // Get price change percentage for a holding
  getHoldingPriceChange(holding: any): number {
    const asset = this.dataService.getAssetById(holding.assetId);
    if (!asset) return 0;

    // Find the current price point
    const currentPerformancePoint = asset.historicalPerformance
      .filter((point: any) => point.date <= this.currentDate)
      .sort((a: any, b: any) => b.date.localeCompare(a.date))[0];

    if (!currentPerformancePoint) return 0;

    // Find the previous price point
    const previousPerformancePoint = asset.historicalPerformance
      .filter((point: any) => point.date < currentPerformancePoint.date)
      .sort((a: any, b: any) => b.date.localeCompare(a.date))[0];

    if (!previousPerformancePoint) return 0;

    // Calculate percentage change
    const changePercent = ((currentPerformancePoint.value - previousPerformancePoint.value) / previousPerformancePoint.value) * 100;
    return changePercent;
  }

  // Get 90-day performance for holdings overview
  get90DayPerformance(): { percentage: number, amount: number } {
    if (this.holdings.length === 0) {
      return { percentage: 0, amount: 0 };
    }

    let totalCurrentValue = 0;
    let totalPreviousValue = 0;

    for (const holding of this.holdings) {
      const asset = this.dataService.getAssetById(holding.assetId);
      if (!asset) continue;

      // Get current price
      const currentPrice = this.holdingsService.getCurrentPrice(asset, this.currentDate);
      const currentValue = holding.shares * currentPrice;
      totalCurrentValue += currentValue;

      // Get price from 90 days ago (approximately 3 months)
      const currentDate = new Date(this.currentDate);
      const ninetyDaysAgo = new Date(currentDate);
      ninetyDaysAgo.setDate(currentDate.getDate() - 90);
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

  // Get price change percentage for daily movers (relative to previous quarter)
  getPriceChange(asset: any): number {
    // Get the current quarter based on current date
    const currentQuarter = getQuarterForDate(this.currentDate);
    if (!currentQuarter) {
      return 0;
    }
    
    // Get the current quarter start date price
    const currentQuarterPrice = asset.historicalPerformance
      .find((point: any) => point.date === currentQuarter.value);
    
    if (!currentQuarterPrice) {
      return 0;
    }
    
    // Get the previous quarter
    const previousQuarter = getPreviousQuarter(currentQuarter.value);
    if (!previousQuarter) {
      return 0; // No previous quarter available
    }
    
    // Get the previous quarter start date price
    const previousQuarterPrice = asset.historicalPerformance
      .find((point: any) => point.date === previousQuarter.value);
    
    if (!previousQuarterPrice) {
      return 0;
    }
    
    // Calculate percentage change from previous quarter
    const changePercent = ((currentQuarterPrice.value - previousQuarterPrice.value) / previousQuarterPrice.value) * 100;
    return changePercent;
  }

  // Navigation methods
  goToProfileTab(): void {
    this.tabGroup.selectedIndex = 4; // Profile tab is index 4
    // Scroll to top of the container
    this.scrollToTop();
  }

  goToHoldingsTab(): void {
    this.tabGroup.selectedIndex = 2; // Holdings tab is index 2
    // Scroll to top of the container
    this.scrollToTop();
  }

  // Scroll to top of the investing container
  scrollToTop(): void {
    const container = document.querySelector('.investing-container');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Holdings tab methods
  selectedHolding: any = null;

  selectHolding(holding: any): void {
    this.selectedHolding = holding;
    
    // Force re-render line chart when holding is selected
    setTimeout(() => {
      this.initializeLineChart();
      this.updateLineChart();
    }, 100);
  }

  selectHoldingAndNavigate(holding: any): void {
    this.selectedHolding = holding;
    this.goToHoldingsTab();
    
    // Force re-render line chart after navigation
    setTimeout(() => {
      this.initializeLineChart();
      this.updateLineChart();
    }, 200); // Slightly longer delay for navigation
  }

  private generateQuarterlyStatements(): void {
    const quarters = [
      { start: '2024-10-01', end: '2024-12-31', label: 'Q4 2024', period: 'October 1 - December 31, 2024' },
      { start: '2025-01-01', end: '2025-03-31', label: 'Q1 2025', period: 'January 1 - March 31, 2025' },
      { start: '2025-04-01', end: '2025-06-30', label: 'Q2 2025', period: 'April 1 - June 30, 2025' },
      { start: '2025-07-01', end: '2025-09-30', label: 'Q3 2025', period: 'July 1 - September 30, 2025' },
      { start: '2025-10-01', end: '2025-12-31', label: 'Q4 2025', period: 'October 1 - December 31, 2025' }
    ];

    this.quarterlyStatements = quarters
      .filter(quarter => quarter.end <= this.currentDate) // Only show quarters up to current date
      .slice(1) // Always hide the first quarter (Q4 2024)
      .map(quarter => ({
        ...quarter,
        quarter: quarter.label,
        endingCashBalance: this.calculateEndingCashBalance(quarter.end),
        endingHoldingsValue: this.calculateEndingHoldingsValue(quarter.end),
        performance: {
          totalReturn: this.calculateTotalReturn(quarter.end)
        }
      }));
  }

  private calculateEndingCashBalance(endDate: string): number {
    // Get the brokerage balance as of the end date using the transactions service
    return this.transactionsService.getBalanceAtDate('brokerage001', endDate);
  }

  private calculateEndingHoldingsValue(endDate: string): number {
    // Calculate holdings value as of the end date
    let totalValue = 0;
    
    // Get holdings as of the end date
    const holdingsAtDate = this.holdingsService.getHoldingsAtDate(endDate);
    
    for (const holding of holdingsAtDate) {
      if (holding.shares > 0) {
        // Get the asset price as of the end date
        const asset = this.dataService.assets.find(a => a.id === holding.assetId);
        if (asset) {
          const priceData = asset.historicalPerformance.find(p => p.date === endDate);
          if (priceData) {
            totalValue += holding.shares * priceData.value;
          }
        }
      }
    }
    
    return totalValue;
  }

  private calculateTotalReturn(endDate: string): number {
    // Calculate total return based on actual holdings performance
    const holdingsValue = this.calculateEndingHoldingsValue(endDate);
    const cashBalance = this.calculateEndingCashBalance(endDate);
    const totalValue = holdingsValue + cashBalance;
    
    // For now, return 0 if no holdings (this could be enhanced with actual performance calculation)
    if (totalValue === 0) return 0;
    
    // Simple calculation based on holdings performance - return dollar amount
    // This could be enhanced to calculate actual returns based on purchase prices
    const daysSinceStart = Math.floor((new Date(endDate).getTime() - new Date('2024-10-01').getTime()) / (1000 * 60 * 60 * 24));
    const dailyReturn = 0.0005; // 0.05% daily return (more conservative)
    const returnPercentage = Math.min(daysSinceStart * dailyReturn, 0.10); // Cap at 10% for demo
    return totalValue * returnPercentage; // Return dollar amount instead of percentage
  }

  openAssetDetailsDialog(asset: any): void {
    const dialogData: AssetDetailsDialogData = {
      asset: asset,
      currentDate: this.currentDate
    };

    this.dialog.open(AssetDetailsDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: dialogData
    });
  }


}
