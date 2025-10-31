import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface QuarterNavigationDialogData {
  nextQuarterLabel: string;
}

@Component({
  selector: 'app-quarter-navigation-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './quarter-navigation-dialog.component.html',
  styleUrl: './quarter-navigation-dialog.component.scss'
})
export class QuarterNavigationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<QuarterNavigationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QuarterNavigationDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}


