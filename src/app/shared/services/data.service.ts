import { Injectable } from '@angular/core';
import { ASSETS, Asset, AssetType } from '../data/assets.data';

export type AssetClass = 'Stocks' | 'Bonds' | 'Cash';

export interface AdminOptions {
  lineGraphYAxis: 'consistent' | 'dynamic';
  layout: 'default' | 'web_browser';
}

export interface CategoryOption {
  id: string;
  label: string;
  assetTypes: AssetType[];
}

@Injectable({
  providedIn: 'root'
})
export class DataService {

  public assets: Asset[] = ASSETS;
  private readonly OPTIONS_KEY = 'investing_sim__admin_options';

  // All available asset types - single source of truth
  public readonly ALL_ASSET_TYPES: readonly AssetType[] = [
    'stock',
    'mutual_fund',
    'etf',
    'target_date_fund',
    'bond_fund'
  ] as const;

  /**
   * Get asset by ID
   */
  getAssetById(id: string): Asset | undefined {
    return this.assets.find(a => a.id === id);
  }

  /**
   * Get all asset types
   */
  getAllAssetTypes(): readonly AssetType[] {
    return this.ALL_ASSET_TYPES;
  }

  /**
   * Get buy categories for trading
   */
  getBuyCategories(): CategoryOption[] {
    return [
      { id: 'stocks', label: 'Stocks', assetTypes: ['stock'] },
      { id: 'funds', label: 'Funds', assetTypes: ['mutual_fund', 'etf', 'target_date_fund'] },
      { id: 'bonds', label: 'Bonds', assetTypes: ['bond_fund'] }
    ];
  }

  /**
   * Asset-class weights (Stocks vs Bonds) for a holding, for the Stocks/Bonds/Cash
   * allocation lens. Blended funds (e.g. target-date) use their stockBondSplit; bond
   * funds are all bonds; everything else is all stocks. Single source reused by the
   * dashboard allocation and the statement breakdown.
   */
  getAssetClassWeights(asset: Asset): { stocks: number; bonds: number } {
    if (asset.stockBondSplit) {
      return asset.stockBondSplit;
    }
    if (asset.type === 'bond_fund') {
      return { stocks: 0, bonds: 1 };
    }
    return { stocks: 1, bonds: 0 };
  }

  /**
   * Sum a set of holdings into Stocks/Bonds totals using the per-asset class
   * weights. The single home for the weighted-sum step of the Stocks/Bonds/Cash
   * lens — used by the dashboard allocation, the statement breakdown, and the
   * Year-End capstone.
   */
  getAssetClassTotals(holdings: Array<{ assetId: string; value: number }>): { stocks: number; bonds: number } {
    let stocks = 0;
    let bonds = 0;
    for (const holding of holdings) {
      const asset = this.getAssetById(holding.assetId);
      if (asset) {
        const weights = this.getAssetClassWeights(asset);
        stocks += holding.value * weights.stocks;
        bonds += holding.value * weights.bonds;
      }
    }
    return { stocks, bonds };
  }

  /**
   * Get admin options from localStorage
   */
  getOptions(): AdminOptions {
    const defaultOptions: AdminOptions = {
      lineGraphYAxis: 'dynamic',
      layout: 'web_browser'
    };

    const storedOptions = localStorage.getItem(this.OPTIONS_KEY);
    if (storedOptions) {
      try {
        return { ...defaultOptions, ...JSON.parse(storedOptions) };
      } catch (error) {
        console.error('Error parsing stored admin options:', error);
        return defaultOptions;
      }
    }

    return defaultOptions;
  }
}