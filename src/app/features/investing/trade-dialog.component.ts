import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../shared/services/data.service';
import { HoldingsService } from '../../shared/services/holdings.service';
import { Asset } from '../../shared/data/assets.data';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { DefineComponent } from '../../shared/components/define/define.component';

export interface TradeData {
  assetId: string;
  action: 'Buy' | 'Sell';
  shares: number;
  dollars: number;
  timestamp: string;
}

export interface TradeDialogData {
  action: 'buy' | 'sell';
  brokerageBalance: number;
  currentDate: string;
  holdings: any[];
}

/**
 * Flattened single-screen trade form (replaces the 4-step wizard). Reuses the price
 * source (HoldingsService.getCurrentPrice) and the shared ConfirmationDialogComponent.
 * Returns a TradeData on a confirmed trade.
 */
@Component({
  selector: 'app-trade-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, MatButtonToggleModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatRadioModule, MatIconModule,
    FormsModule, DefineComponent
  ],
  templateUrl: './trade-dialog.component.html',
  styleUrl: './trade-dialog.component.scss'
})
export class TradeDialogComponent {
  action: 'buy' | 'sell';
  selectedAssetId = '';
  inputType: 'dollars' | 'shares' = 'dollars';
  inputAmount: number | null = null;
  currentPrice = 0;
  readonly minPurchase = 1;

  stocks: Asset[] = [];
  funds: Asset[] = [];
  bonds: Asset[] = [];

  constructor(
    public dialogRef: MatDialogRef<TradeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TradeDialogData,
    public dataService: DataService,
    private holdingsService: HoldingsService,
    private dialog: MatDialog
  ) {
    this.action = data.action;
    const assets = this.dataService.assets;
    this.stocks = assets.filter(a => a.type === 'stock');
    this.funds = assets.filter(a => a.type === 'mutual_fund' || a.type === 'etf' || a.type === 'target_date_fund');
    this.bonds = assets.filter(a => a.type === 'bond_fund');
  }

  onActionChange(action: 'buy' | 'sell'): void {
    this.action = action;
    this.selectedAssetId = '';
    this.inputAmount = null;
    this.currentPrice = 0;
  }

  onAssetSelect(): void {
    const asset = this.dataService.getAssetById(this.selectedAssetId);
    this.currentPrice = asset ? this.holdingsService.getCurrentPrice(asset, this.data.currentDate) : 0;
    this.inputAmount = null;
  }

  getHolding(assetId: string): any {
    return this.data.holdings.find(h => h.assetId === assetId);
  }

  // Sellable cap: position at the current date, also bounded by the end-of-sim
  // net position so a back-dated sell (teacher time override) can't oversell.
  getMaxSellable(assetId: string): number {
    return this.holdingsService.getMaxSellableShares(assetId, this.data.currentDate);
  }

  getCalculatedShares(): number {
    if (this.inputAmount === null || this.currentPrice <= 0) return 0;
    return this.inputType === 'dollars'
      ? Math.round((this.inputAmount / this.currentPrice) * 1e6) / 1e6
      : this.inputAmount;
  }

  getCalculatedDollars(): number {
    if (this.inputAmount === null || this.currentPrice <= 0) return 0;
    return this.inputType === 'shares'
      ? Math.round((this.inputAmount * this.currentPrice) * 100) / 100
      : this.inputAmount;
  }

  isValid(): boolean {
    if (!this.selectedAssetId || this.inputAmount === null) return false;
    if (this.action === 'buy') {
      const dollars = this.getCalculatedDollars();
      return dollars >= this.minPurchase && dollars <= this.data.brokerageBalance;
    }
    const holding = this.getHolding(this.selectedAssetId);
    return !!holding && this.getCalculatedShares() <= this.getMaxSellable(this.selectedAssetId);
  }

  validationMessage(): string {
    if (!this.selectedAssetId || this.inputAmount === null) return '';
    if (this.action === 'buy') {
      const dollars = this.getCalculatedDollars();
      if (dollars > 0 && dollars < this.minPurchase) return `Minimum purchase is $${this.minPurchase.toFixed(2)}.`;
      if (dollars > this.data.brokerageBalance) return `Insufficient cash. Available: $${this.data.brokerageBalance.toFixed(2)}`;
    } else {
      const maxSellable = this.getMaxSellable(this.selectedAssetId);
      if (this.getCalculatedShares() > maxSellable) {
        return `Insufficient shares. You can sell up to ${maxSellable.toFixed(4)}.`;
      }
    }
    return '';
  }

  submit(): void {
    if (!this.isValid()) return;
    const asset = this.dataService.getAssetById(this.selectedAssetId);
    if (!asset) return;
    const shares = this.getCalculatedShares();
    const dollars = this.getCalculatedDollars();

    const confirmationData: ConfirmationDialogData = {
      title: `Confirm ${this.action === 'buy' ? 'Buy' : 'Sell'} Order`,
      message: `Are you sure you want to ${this.action} this investment?`,
      confirmText: this.action === 'buy' ? 'Buy' : 'Sell',
      cancelText: 'Cancel',
      type: 'trade',
      tradeData: { action: this.action, assetName: asset.name, shares, price: this.currentPrice, totalAmount: dollars }
    };

    this.dialog.open(ConfirmationDialogComponent, { width: '500px', data: confirmationData })
      .afterClosed().subscribe(confirmed => {
        if (confirmed) {
          const trade: TradeData = {
            assetId: this.selectedAssetId,
            action: this.action === 'buy' ? 'Buy' : 'Sell',
            shares,
            dollars,
            timestamp: new Date().toISOString()
          };
          this.dialogRef.close(trade);
        }
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
