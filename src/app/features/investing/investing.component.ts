import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
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
import { TransferDialogComponent } from '../banking/transfer-dialog.component';
import { AssetTypePipe } from '../../shared/pipes/asset-type.pipe';
import { PlaceTradeComponent, TradeData } from './place-trade.component';
import { HoldingsTotalsComponent } from '../../shared/components/holdings-totals/holdings-totals.component';
import { Chart, registerables } from 'chart.js';

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

  // Quarterly statements data
  quarterlyStatements = [
    {
      quarter: 'Q1 2025',
      period: 'January 1 - March 31, 2025',
      beginningBalance: 0,
      endingBalance: 5000,
      trades: [
        { date: '2025-01-15', action: 'Buy', asset: 'AAPL', shares: 10, price: 150.00, amount: 1500.00 },
        { date: '2025-02-10', action: 'Buy', asset: 'MSFT', shares: 5, price: 300.00, amount: 1500.00 },
        { date: '2025-03-05', action: 'Buy', asset: 'GOOGL', shares: 3, price: 2500.00, amount: 7500.00 }
      ],
      dividends: 0,
      interest: 0,
      fees: 15.00,
      netGainLoss: 5000,
      totalReturn: 0
    },
    {
      quarter: 'Q2 2025',
      period: 'April 1 - June 30, 2025',
      beginningBalance: 5000,
      endingBalance: 12000,
      trades: [
        { date: '2025-04-20', action: 'Buy', asset: 'TSLA', shares: 2, price: 200.00, amount: 400.00 },
        { date: '2025-05-15', action: 'Sell', asset: 'AAPL', shares: 5, price: 160.00, amount: 800.00 }
      ],
      dividends: 25.00,
      interest: 0,
      fees: 10.00,
      netGainLoss: 7000,
      totalReturn: 140.00
    }
  ];
  
  private subscription = new Subscription();

  constructor(public dataService: DataService, public transactionsService: TransactionsService, public holdingsService: HoldingsService, public currentDateService: CurrentDateService, private dialog: MatDialog) {
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
      })
    );

    // Subscribe to account balance
    this.subscription.add(
      this.transactionsService.getCurrentBalance$('brokerage001').subscribe(balance => {
        this.brokerageBalance = balance;
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
    // Initialize chart after view is ready
    this.initializeChart();
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

  private initializeLineChart(): void {
    if (!this.lineChartCanvas) return;

    // Destroy existing line chart if it exists
    if (this.lineChart) {
      this.lineChart.destroy();
    }

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
            beginAtZero: false
          }
        }
      }
    });
  }

  private updateLineChart(): void {
    if (!this.lineChart || !this.selectedHolding) return;

    const asset = this.dataService.getAssetById(this.selectedHolding.assetId);
    if (!asset) return;

    // Get historical data up to current date
    const historicalData = asset.historicalPerformance
      .filter((point: any) => point.date <= this.currentDate)
      .sort((a: any, b: any) => a.date.localeCompare(b.date));

    const labels = historicalData.map((point: any) => {
      const date = new Date(point.date);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    const data = historicalData.map((point: any) => point.value);

    this.lineChart.data.labels = labels;
    this.lineChart.data.datasets[0].data = data;
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
      width: '400px',
      maxHeight: '90vh',
      data: { 
        maxAmount: this.brokerageBalance,
        currentDate: this.currentDate,
        transferDirection: 'to-banking' as const
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
      width: '400px',
      maxHeight: '90vh',
      data: { 
        maxAmount: this.bankingBalance, // Use actual banking balance
        currentDate: this.currentDate,
        transferDirection: 'to-brokerage' as const
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.amount > 0) {
            this.transactionsService.addTransferTransaction(result.amount, this.currentDate);
      }
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
    // Define all possible asset types
    const allAssetTypes = ['stock', 'mutual_fund', 'index_fund', 'etf', 'target_date_fund', 'bond_fund'];
    
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
    this.assetTypeAllocation = allAssetTypes
      .map(type => ({
        type,
        value: typeTotals[type],
        percentage: totalValue > 0 ? (typeTotals[type] / totalValue) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending
    
    // Update chart if it exists
    if (this.chart) {
      this.updateChart();
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

  // Get price change percentage for daily movers
  getPriceChange(asset: any): number {
    const currentPrice = this.getCurrentPrice(asset);
    
    // Find the current date's performance point
    const currentPerformancePoint = asset.historicalPerformance
      .filter((point: any) => point.date <= this.currentDate)
      .sort((a: any, b: any) => b.date.localeCompare(a.date))[0];
    
    if (!currentPerformancePoint) {
      return 0; // No data available
    }
    
    // Find the previous performance point (before current date)
    const previousPerformancePoint = asset.historicalPerformance
      .filter((point: any) => point.date < currentPerformancePoint.date)
      .sort((a: any, b: any) => b.date.localeCompare(a.date))[0];
    
    if (!previousPerformancePoint) {
      return 0; // No previous data available
    }
    
    // Calculate percentage change
    const changePercent = ((currentPerformancePoint.value - previousPerformancePoint.value) / previousPerformancePoint.value) * 100;
    return changePercent;
  }

  // Navigation methods
  goToProfileTab(): void {
    this.tabGroup.selectedIndex = 4; // Profile tab is index 4
  }

  goToHoldingsTab(): void {
    this.tabGroup.selectedIndex = 2; // Holdings tab is index 2
  }

  // Holdings tab methods
  selectedHolding: any = null;

  selectHolding(holding: any): void {
    this.selectedHolding = holding;
    
    // Initialize line chart if it doesn't exist
    if (!this.lineChart) {
      this.initializeLineChart();
    }
    
    // Update line chart with new data
    this.updateLineChart();
  }

  selectHoldingAndNavigate(holding: any): void {
    this.selectedHolding = holding;
    this.goToHoldingsTab();
    
    // Initialize line chart after navigation
    setTimeout(() => {
      if (!this.lineChart) {
        this.initializeLineChart();
      }
      this.updateLineChart();
    }, 100);
  }
}
