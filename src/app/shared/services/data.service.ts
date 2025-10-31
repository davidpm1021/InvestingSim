import { Injectable } from '@angular/core';
import { ASSETS, Asset, AssetType } from '../data/assets.data';

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
    'index_fund',
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
    const allAssetTypes = Array.from(this.ALL_ASSET_TYPES);
    
    // Get specific asset types directly from the centralized list (type-safe)
    const stockType: AssetType = 'stock';
    const basketTypes: AssetType[] = ['index_fund', 'mutual_fund', 'etf', 'target_date_fund'];
    const bondType: AssetType = 'bond_fund';
    
    // Verify types exist in the centralized list and filter basket types
    const validBasketTypes = basketTypes.filter(type => allAssetTypes.includes(type));
    
    return [
      { 
        id: 'individual_stocks', 
        label: 'Individual Stocks', 
        assetTypes: allAssetTypes.includes(stockType) ? [stockType] : []
      },
      { 
        id: 'basket_of_stocks', 
        label: 'Basket of Stocks', 
        assetTypes: validBasketTypes
      },
      { 
        id: 'bonds', 
        label: 'Bonds', 
        assetTypes: allAssetTypes.includes(bondType) ? [bondType] : []
      }
    ];
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