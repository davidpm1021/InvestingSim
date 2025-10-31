import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../../shared/services/data.service';
import { TransactionsService } from '../../shared/services/transactions.service';
import { HoldingsService } from '../../shared/services/holdings.service';

export interface StatementDialogData {
  quarter: any;
  currentDate: string;
}

@Component({
  selector: 'app-statement-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './statement-dialog.component.html',
  styleUrl: './statement-dialog.component.scss'
})
export class StatementDialogComponent implements OnInit {
  statement: any = {};
  currentDate: string = '';

  constructor(
    public dialogRef: MatDialogRef<StatementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StatementDialogData,
    private dataService: DataService,
    private transactionsService: TransactionsService,
    private holdingsService: HoldingsService
  ) {}

  ngOnInit(): void {
    this.currentDate = this.data.currentDate;
    this.statement = this.generateStatementForQuarter(this.data.quarter);
  }

  close(): void {
    this.dialogRef.close();
  }

  private generateStatementForQuarter(quarter: any): any {
    // Get all transactions for this quarter
    const allTransactions = this.transactionsService.getAllTransactions();
    const quarterTransactions = allTransactions
      .filter((tx: any) => tx.date >= quarter.start && tx.date <= quarter.end);

    // Get trading transactions
    const trades = quarterTransactions
      .filter((tx: any) => tx.type === 'trade')
      .map((tx: any) => ({
        date: tx.date,
        action: tx.description.includes('Purchased') ? 'Buy' : 'Sold',
        asset: this.extractAssetName(tx.description),
        shares: this.extractShares(tx.description),
        price: this.extractPrice(tx.description),
        amount: Math.abs(tx.amount)
      }));

    // Calculate beginning balances (at end of previous quarter)
    const beginningCashBalance = this.calculateBeginningCashBalance(quarter.start);
    const beginningHoldingsValue = this.calculateBeginningHoldingsValue(quarter.start);
    
    // Calculate ending balances (at end of quarter)
    const endingCashBalance = this.transactionsService.getBalanceAtDate('brokerage001', quarter.end);
    const endingHoldingsValue = this.calculateHoldingsValueAtDate(quarter.end);

    // Calculate dividends and interest (mock for now - could be enhanced with actual dividend data)
    const dividends = this.calculateDividendsForQuarter(quarter);
    const interest = this.calculateInterestForQuarter(quarter);

    // Calculate assets performance for the quarter
    const assets = this.calculateAssetsPerformance(quarter);

    // Calculate total gain/loss from individual assets
    const totalAssetsGainLoss = assets.reduce((sum, asset) => sum + asset.gainLoss, 0);
    
    // Calculate total return percentage based on beginning holdings value
    const totalAssetsReturn = beginningHoldingsValue > 0 ? (totalAssetsGainLoss / beginningHoldingsValue) * 100 : 0;

    // Calculate performance totals
    const performance = {
      holdingsGainLoss: totalAssetsGainLoss,
      dividends: dividends,
      interest: interest,
      total: totalAssetsGainLoss + dividends + interest,
      totalReturn: totalAssetsReturn
    };

    return {
      quarter: quarter.label,
      period: quarter.period,
      beginningCashBalance,
      beginningHoldingsValue,
      endingCashBalance,
      endingHoldingsValue,
      performance,
      assets,
      trades
    };
  }

  private extractAssetName(description: string): string {
    // Extract asset name from description like "Purchased 0.36 shares of Apple Inc. (Stock) at $120.00"
    const match = description.match(/of ([^(]+)/);
    return match ? match[1].trim() : 'Unknown Asset';
  }

  private extractShares(description: string): number {
    // Extract shares from description like "Purchased 0.36 shares of Apple Inc. (Stock) at $120.00"
    const match = description.match(/(\d+\.?\d*)\s+shares/);
    return match ? parseFloat(match[1]) : 0;
  }

  private extractPrice(description: string): number {
    // Extract price from description like "Purchased 0.36 shares of Apple Inc. (Stock) at $120.00"
    const match = description.match(/\$(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  }

  private calculateHoldingsValueAtDate(date: string): number {
    // Get holdings at the specified date
    const holdingsAtDate = this.holdingsService.getHoldingsAtDate(date);
    
    // Calculate total holdings value
    let holdingsValue = 0;
    holdingsAtDate.forEach(holding => {
      const asset = this.dataService.getAssetById(holding.assetId);
      if (asset) {
        const price = this.holdingsService.getCurrentPrice(asset, date);
        holdingsValue += holding.shares * price;
      }
    });
    
    return holdingsValue;
  }

  private calculateDividendsForQuarter(quarter: any): number {
    // Mock dividend calculation - could be enhanced with actual dividend data
    const holdingsAtEnd = this.holdingsService.getHoldingsAtDate(quarter.end);
    let totalDividends = 0;
    
    holdingsAtEnd.forEach(holding => {
      const asset = this.dataService.getAssetById(holding.assetId);
      if (asset && asset.dividendYield) {
        const price = this.holdingsService.getCurrentPrice(asset, quarter.end);
        const quarterlyDividend = (asset.dividendYield / 4) * holding.shares * price;
        totalDividends += quarterlyDividend;
      }
    });
    
    return totalDividends;
  }

  private calculateInterestForQuarter(quarter: any): number {
    // Mock interest calculation for bond funds
    const holdingsAtEnd = this.holdingsService.getHoldingsAtDate(quarter.end);
    let totalInterest = 0;
    
    holdingsAtEnd.forEach(holding => {
      const asset = this.dataService.getAssetById(holding.assetId);
      if (asset && asset.interestRate) {
        const price = this.holdingsService.getCurrentPrice(asset, quarter.end);
        const quarterlyInterest = (asset.interestRate / 4) * holding.shares * price;
        totalInterest += quarterlyInterest;
      }
    });
    
    return totalInterest;
  }

  private calculateAssetsPerformance(quarter: any): any[] {
    // Get holdings at start and end of quarter
    const holdingsAtStart = this.holdingsService.getHoldingsAtDate(quarter.start);
    const holdingsAtEnd = this.holdingsService.getHoldingsAtDate(quarter.end);
    
    // Calculate the first day of the next quarter for end price
    const nextQuarterStart = this.getNextQuarterStart(quarter.end);
    
    // Create a map of holdings at end for easy lookup
    const endHoldingsMap = new Map();
    holdingsAtEnd.forEach(holding => {
      endHoldingsMap.set(holding.assetId, holding);
    });
    
    // Calculate performance for each asset that was held at the end of the quarter
    const assetsPerformance = holdingsAtEnd.map(holding => {
      const asset = this.dataService.getAssetById(holding.assetId);
      if (!asset) return null;
      
      // Get price at start of quarter and first day of next quarter
      const startPrice = this.holdingsService.getCurrentPrice(asset, quarter.start);
      const endPrice = this.holdingsService.getCurrentPrice(asset, nextQuarterStart);
      
      // Calculate gain/loss
      const gainLoss = (endPrice - startPrice) * holding.shares;
      const gainLossPercent = startPrice > 0 ? ((endPrice - startPrice) / startPrice) * 100 : 0;
      
      return {
        assetId: holding.assetId,
        assetName: asset.name,
        shares: holding.shares,
        startPrice: startPrice,
        endPrice: endPrice,
        gainLoss: gainLoss,
        gainLossPercent: gainLossPercent
      };
    }).filter(asset => asset !== null);
    
    return assetsPerformance;
  }

  private getNextQuarterStart(dateString: string): string {
    // Convert date string to Date object, add one day, and return as string
    const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
    date.setDate(date.getDate() + 1);
    
    // Format back to YYYY-MM-DD string
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  private calculateBeginningCashBalance(quarterStart: string): number {
    // Get the last day of the previous quarter
    const lastDayOfPreviousQuarter = this.getDayBefore(quarterStart);
    
    // Return the cash balance at the end of the previous quarter
    return this.transactionsService.getBalanceAtDate('brokerage001', lastDayOfPreviousQuarter);
  }

  private calculateBeginningHoldingsValue(quarterStart: string): number {
    // Get the last day of the previous quarter
    const lastDayOfPreviousQuarter = this.getDayBefore(quarterStart);
    
    // Return the holdings value at the end of the previous quarter
    return this.calculateHoldingsValueAtDate(lastDayOfPreviousQuarter);
  }

  private getDayBefore(dateString: string): string {
    // Convert date string to Date object, subtract one day, and return as string
    const date = new Date(dateString);
    date.setDate(date.getDate() - 1);
    
    // Format back to YYYY-MM-DD string
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
}
