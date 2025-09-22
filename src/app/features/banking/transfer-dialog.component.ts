import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';

export interface TransferDialogData {
  maxAmount: number;
  currentDate: string;
  transferDirection: 'to-brokerage' | 'to-banking';
  sourceBalance?: number;
  destinationBalance?: number;
}

export interface TransferDialogResult {
  amount: number;
}

@Component({
  selector: 'app-transfer-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, FormsModule],
  templateUrl: './transfer-dialog.component.html',
  styleUrl: './transfer-dialog.component.scss'
})
export class TransferDialogComponent {
  transferAmount: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<TransferDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TransferDialogData,
    private dialog: MatDialog
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

  getDestinationBalance(): number {
    // Use the passed destination balance if available, otherwise use a default
    if (this.data.destinationBalance !== undefined) {
      return this.data.destinationBalance;
    }
    return this.data.transferDirection === 'to-brokerage' ? 0 : this.data.maxAmount;
  }

  getSourceBalance(): number {
    // Use the passed source balance if available, otherwise use maxAmount
    if (this.data.sourceBalance !== undefined) {
      return this.data.sourceBalance;
    }
    return this.data.maxAmount;
  }

  isValidAmount(): boolean {
    return this.transferAmount !== null && this.transferAmount > 0 && this.transferAmount <= this.data.maxAmount;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onTransfer(): void {
    if (this.isValidAmount() && this.transferAmount !== null) {
      const confirmationData: ConfirmationDialogData = {
        title: `Confirm ${this.dialogTitle}`,
        message: `Are you sure you want to ${this.data.transferDirection === 'to-brokerage' ? 'add' : 'withdraw'} these funds?`,
        confirmText: this.data.transferDirection === 'to-brokerage' ? 'Add Funds' : 'Withdraw Funds',
        cancelText: 'Cancel',
        type: 'transfer',
        transferData: {
          direction: this.data.transferDirection,
          amount: this.transferAmount,
          fromAccount: this.data.transferDirection === 'to-brokerage' ? 'banking001' : 'brokerage001',
          toAccount: this.data.transferDirection === 'to-brokerage' ? 'brokerage001' : 'banking001'
        }
      };

      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '500px',
        data: confirmationData
      });

      dialogRef.afterClosed().subscribe(confirmed => {
        if (confirmed) {
          this.dialogRef.close({ amount: this.transferAmount });
        }
      });
    }
  }
}
