import { Pipe, PipeTransform } from '@angular/core';
import { AssetType } from '../data/assets.data';

@Pipe({
  name: 'assetType',
  standalone: true
})
export class AssetTypePipe implements PipeTransform {

  transform(value: AssetType | string | undefined): string {
    if (!value) return '';
    if (value === 'etf') return 'ETF';
    // "target-date" is a compound modifier of "fund", so it takes a hyphen
    // (the proper fund NAME, e.g. "Target Date 2070 Fund", stays unhyphenated).
    if (value === 'target_date_fund') return 'Target-Date Fund';

    // Convert underscores to spaces and title case
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
