import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

export interface TransferDialogData {
  maxAmount: number;
  currentDate: string;
  transferDirection: 'to-brokerage' | 'to-banking';
}

export interface TransferDialogResult {
  amount: number;
}

@Component({
  selector: 'app-transfer-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: './transfer-dialog.component.html',
  styleUrl: './transfer-dialog.component.scss'
})
export class TransferDialogComponent {
  transferAmount: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<TransferDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TransferDialogData
  ) {}

  get dialogTitle(): string {
    return this.data.transferDirection === 'to-brokerage' ? 'Add Funds' : 'Withdraw Funds';
  }

  get accountType(): string {
    return this.data.transferDirection === 'to-brokerage' ? 'Banking' : 'Brokerage';
  }

  get transferDescription(): string {
    return this.data.transferDirection === 'to-brokerage' ? 'Add funds to brokerage' : 'Withdraw funds to banking';
  }

  isValidAmount(): boolean {
    return this.transferAmount !== null && this.transferAmount > 0 && this.transferAmount <= this.data.maxAmount;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onTransfer(): void {
    if (this.isValidAmount() && this.transferAmount !== null) {
      this.dialogRef.close({ amount: this.transferAmount });
    }
  }
}
