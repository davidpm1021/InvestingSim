import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DataService } from '../../shared/services/data.service';
import { HoldingsService } from '../../shared/services/holdings.service';
import { Asset } from '../../shared/data/assets.data';
import { AssetTypePipe } from '../../shared/pipes/asset-type.pipe';

export interface TradeData {
  assetId: string;
  action: 'Buy' | 'Sell';
  shares: number;
  dollars: number;
  timestamp: string;
}

export interface CategoryOption {
  id: string;
  label: string;
  assetTypes: string[];
}

@Component({
  selector: 'app-place-trade',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatRadioModule, MatSelectModule, MatSlideToggleModule, MatStepperModule, MatChipsModule, MatIconModule, FormsModule, AssetTypePipe],
  templateUrl: './place-trade.component.html',
  styleUrl: './place-trade.component.scss'
})
export class PlaceTradeComponent implements OnInit, OnDestroy {
  @Input() brokerageBalance: number = 0;
  @Input() currentDate: string = '';

  @Output() tradeSubmitted = new EventEmitter<TradeData>();

  // Step management
  currentStep: number = 1;
  isBuy: boolean = true;
  
  // Category and asset selection
  selectedCategory: string = '';
  selectedAsset: string = '';
  availableAssets: Asset[] = [];
  currentHoldings: any[] = [];
  
  // Trade calculation
  inputType: 'dollars' | 'shares' = 'dollars';
  inputAmount: number | null = null;
  currentPrice: number = 0;
  
  // Category options for Buy
  buyCategories: CategoryOption[] = [
    { id: 'individual_stocks', label: 'Individual Stocks', assetTypes: ['stock'] },
    { id: 'basket_of_stocks', label: 'Basket of Stocks', assetTypes: ['index_fund', 'mutual_fund', 'etf', 'target_date_fund'] },
    { id: 'bonds', label: 'Bonds', assetTypes: ['bond_fund'] }
  ];
  
  private subscription = new Subscription();

  constructor(
    public dataService: DataService,
    private holdingsService: HoldingsService
  ) {}

  ngOnInit(): void {
    // Subscribe to current holdings
    this.subscription.add(
      this.holdingsService.holdings$.subscribe(holdings => {
        this.currentHoldings = holdings;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // Step 1: Buy/Sell selection
  onActionChange(isBuy: boolean): void {
    this.isBuy = isBuy;
    this.selectedCategory = '';
    this.selectedAsset = '';
    this.availableAssets = [];
    this.inputAmount = null;
    this.currentStep = 2;
  }

  // Step 2: Category selection (Buy) or Asset selection (Sell)
  onCategorySelect(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.selectedAsset = '';
    this.inputAmount = null;
    
    if (this.isBuy) {
      const category = this.buyCategories.find(c => c.id === categoryId);
      if (category) {
        this.availableAssets = this.dataService.assets.filter(asset => 
          category.assetTypes.includes(asset.type)
        );
      }
    } else {
      // For sell, show only assets the user currently holds
      this.availableAssets = this.currentHoldings.map(holding => 
        this.dataService.getAssetById(holding.assetId)
      ).filter(asset => asset !== undefined) as Asset[];
    }
    
    this.currentStep = 3;
  }

  // Step 3: Asset selection
  onAssetSelect(assetId: string): void {
    this.selectedAsset = assetId;
    const asset = this.dataService.getAssetById(assetId);
    if (asset) {
      this.currentPrice = this.getLatestPrice(asset);
      this.inputAmount = null;
      this.currentStep = 4;
    }
  }

  // Step 4: Trade amount calculation
  onInputChange(): void {
    if (this.inputAmount !== null && this.currentPrice > 0) {
      // Round input amount to 2 decimal places
      this.inputAmount = Math.round(this.inputAmount * 100) / 100;
    }
  }

  // Handle input type change and preserve current value
  onInputTypeChange(): void {
    if (this.inputAmount !== null && this.currentPrice > 0) {
      if (this.inputType === 'dollars') {
        // Convert from shares to dollars
        this.inputAmount = Math.round((this.inputAmount * this.currentPrice) * 100) / 100;
      } else {
        // Convert from dollars to shares
        this.inputAmount = Math.round((this.inputAmount / this.currentPrice) * 100) / 100;
      }
    }
  }

  // Get the calculated shares value
  getCalculatedShares(): number {
    if (this.inputAmount !== null && this.currentPrice > 0) {
      if (this.inputType === 'dollars') {
        return Math.round((this.inputAmount / this.currentPrice) * 100) / 100;
      } else {
        return this.inputAmount;
      }
    }
    return 0;
  }

  // Get the calculated dollars value
  getCalculatedDollars(): number {
    if (this.inputAmount !== null && this.currentPrice > 0) {
      if (this.inputType === 'shares') {
        return Math.round((this.inputAmount * this.currentPrice) * 100) / 100;
      } else {
        return this.inputAmount;
      }
    }
    return 0;
  }

  // Get latest price from historical performance
  getLatestPrice(asset: Asset): number {
    if (asset.historicalPerformance.length === 0) return 0;
    return asset.historicalPerformance[asset.historicalPerformance.length - 1].value;
  }

  // Get current holding for an asset
  getCurrentHolding(assetId: string): any {
    return this.currentHoldings.find(h => h.assetId === assetId);
  }

  // Validation
  isTradeValid(): boolean {
    if (!this.selectedAsset || this.inputAmount === null) {
      return false;
    }

    const calculatedDollars = this.getCalculatedDollars();
    const calculatedShares = this.getCalculatedShares();

    if (this.isBuy) {
      return calculatedDollars <= this.brokerageBalance;
    } else {
      const holding = this.getCurrentHolding(this.selectedAsset);
      return holding && calculatedShares <= holding.shares;
    }
  }

  // Submit trade
  onSubmitTrade(): void {
    if (this.isTradeValid() && this.inputAmount !== null) {
      const calculatedShares = this.getCalculatedShares();
      const calculatedDollars = this.getCalculatedDollars();
      
      const tradeData: TradeData = {
        assetId: this.selectedAsset,
        action: this.isBuy ? 'Buy' : 'Sell',
        shares: calculatedShares,
        dollars: calculatedDollars,
        timestamp: new Date().toISOString()
      };
      
      this.tradeSubmitted.emit(tradeData);
      this.resetForm();
    }
  }

  // Reset form
  resetForm(): void {
    this.currentStep = 1;
    this.isBuy = true;
    this.selectedCategory = '';
    this.selectedAsset = '';
    this.availableAssets = [];
    this.inputAmount = null;
    this.currentPrice = 0;
  }

  // Navigation
  goBack(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Get maximum shares that can be bought with current balance
  getMaxShares(): number {
    if (this.currentPrice > 0 && this.isBuy) {
      // Round to 2 decimal places
      return Math.round((this.brokerageBalance / this.currentPrice) * 100) / 100;
    }
    return 0;
  }

  // Get validation message
  getValidationMessage(): string {
    if (this.isBuy) {
      const calculatedDollars = this.getCalculatedDollars();
      if (calculatedDollars > this.brokerageBalance) {
        return `Insufficient balance. Available: $${this.brokerageBalance.toFixed(2)}`;
      }
    } else {
      const holding = this.getCurrentHolding(this.selectedAsset);
      const calculatedShares = this.getCalculatedShares();
      if (holding && calculatedShares > holding.shares) {
        return `Insufficient shares. Available: ${holding.shares.toFixed(2)}`;
      }
    }
    return '';
  }
}
