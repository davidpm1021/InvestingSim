import { Injectable } from '@angular/core';
import { ASSETS, Asset } from '../data/assets.data';

export interface AdminOptions {
  lineGraphYAxis: 'consistent' | 'dynamic';
  layout: 'default' | 'web_browser';
}

@Injectable({
  providedIn: 'root'
})
export class DataService {

  public assets: Asset[] = ASSETS;
  private readonly OPTIONS_KEY = 'investing_sim__admin_options';

  /**
   * Get asset by ID
   */
  getAssetById(id: string): Asset | undefined {
    return this.assets.find(a => a.id === id);
  }

  /**
   * Get admin options from localStorage
   */
  getOptions(): AdminOptions {
    const defaultOptions: AdminOptions = {
      lineGraphYAxis: 'dynamic',
      layout: 'default'
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