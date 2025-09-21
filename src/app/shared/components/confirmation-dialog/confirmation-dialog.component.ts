import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: 'trade' | 'transfer';
  tradeData?: {
    action: 'buy' | 'sell';
    assetName: string;
    shares: number;
    price: number;
    totalAmount: number;
  };
  transferData?: {
    direction: 'to-banking' | 'to-brokerage';
    amount: number;
    fromAccount: string;
    toAccount: string;
  };
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss'
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  getAccountName(accountId: string): string {
    const accountNames: { [key: string]: string } = {
      'banking001': 'Banking Account',
      'brokerage001': 'Brokerage Account'
    };
    return accountNames[accountId] || accountId;
  }
}
