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
  /** When set (e.g. opened from an investment's details), preselect this asset. */
  presetAssetId?: string;
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
  // Shares are fractional and accumulate as floats, so the true position can sit
  // a hair below the 4-decimal figure shown in the table (e.g. 9.21149999 vs
  // "9.2115"). Accept a sell within this tolerance of the held amount, then clamp
  // the actual order to what's held so a "sell everything" never reads as oversell.
  private readonly SELL_EPS = 1e-4;

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
    // Preselect the asset when opened from its details view.
    if (data.presetAssetId) {
      this.selectedAssetId = data.presetAssetId;
      this.onAssetSelect();
    }
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

  /** Shares currently held of the selected asset (0 if none). */
  getHeldShares(assetId: string): number {
    const holding = this.getHolding(assetId);
    return holding ? holding.shares : 0;
  }

  /** Dollar value of the held shares at the current price. */
  getHeldValue(assetId: string): number {
    return this.getHeldShares(assetId) * this.currentPrice;
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
      // Compare in whole cents. The running balance is a floating-point sum of
      // trade amounts (each buy debits shares*price, shares rounded to 6 decimals),
      // so it carries sub-cent noise; a raw `dollars <= balance` compare would then
      // reject spending your full cash (e.g. $505 against a balance of 504.9999864
      // that displays as $505.00). Rounding both sides to cents removes that noise.
      const cents = Math.round(this.getCalculatedDollars() * 100);
      return cents >= Math.round(this.minPurchase * 100) && cents <= Math.round(this.data.brokerageBalance * 100);
    }
    const holding = this.getHolding(this.selectedAssetId);
    const shares = this.getCalculatedShares();
    // Must be a positive amount: a number input still accepts typed negatives,
    // and a 0/negative sell would otherwise grow the position and drain cash.
    return !!holding && shares > 0 && shares <= this.getMaxSellable(this.selectedAssetId) + this.SELL_EPS;
  }

  validationMessage(): string {
    if (!this.selectedAssetId || this.inputAmount === null) return '';
    if (this.action === 'buy') {
      const cents = Math.round(this.getCalculatedDollars() * 100);
      if (cents > 0 && cents < Math.round(this.minPurchase * 100)) return `Minimum purchase is $${this.minPurchase.toFixed(2)}.`;
      if (cents > Math.round(this.data.brokerageBalance * 100)) return `Insufficient cash. Available: $${this.data.brokerageBalance.toFixed(2)}`;
    } else {
      const shares = this.getCalculatedShares();
      if (shares <= 0) return 'Enter an amount greater than zero.';
      const maxSellable = this.getMaxSellable(this.selectedAssetId);
      if (shares > maxSellable + this.SELL_EPS) {
        return `Insufficient shares. You can sell up to ${maxSellable.toFixed(4)}.`;
      }
    }
    return '';
  }

  /** Fill the input with the entire held position so a student can sell all of it. */
  sellAll(): void {
    this.inputType = 'shares';
    // Show the same 4-decimal figure as the table; submit() clamps to the exact held amount.
    this.inputAmount = Math.round(this.getMaxSellable(this.selectedAssetId) * 1e4) / 1e4;
  }

  submit(): void {
    if (!this.isValid()) return;
    const asset = this.dataService.getAssetById(this.selectedAssetId);
    if (!asset) return;
    let shares = this.getCalculatedShares();
    let dollars = this.getCalculatedDollars();
    if (this.action === 'sell') {
      // Clamp to the true held amount so rounding can never record an oversell.
      shares = Math.min(shares, this.getMaxSellable(this.selectedAssetId));
      dollars = Math.round(shares * this.currentPrice * 100) / 100;
    }

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
