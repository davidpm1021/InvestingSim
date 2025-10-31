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

    // Convert underscores to spaces and title case
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
