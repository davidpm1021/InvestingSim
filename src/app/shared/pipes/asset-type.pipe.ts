import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'assetType',
  standalone: true
})
export class AssetTypePipe implements PipeTransform {

  transform(value: string | undefined): string {
    if (!value) return '';

    // Convert underscores to spaces and title case
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
