import { Injectable } from '@angular/core';
import { ASSETS, Asset } from '../data/assets.data';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  public assets: Asset[] = ASSETS;

  /**
   * Get asset by ID
   */
  getAssetById(id: string): Asset | undefined {
    return this.assets.find(a => a.id === id);
  }
}