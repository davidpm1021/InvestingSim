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
  // Guards against a rapid double-click opening two confirmation dialogs; reset on cancel.
  submitting = false;

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
    if (this.transferAmount === null || this.transferAmount <= 0) { return false; }
    // Compare in whole cents. maxAmount is a floating-point balance sum that carries
    // sub-cent noise (trade debits are shares*price), so a raw compare would reject
    // transferring your full displayed balance (e.g. $700 against 699.99993562, which
    // renders as "$700.00"). Same fix as the buy dialog.
    return Math.round(this.transferAmount * 100) <= Math.round(this.data.maxAmount * 100);
  }

  /** Available balance rounded to whole cents — used for the input's native `max` and
   *  the "Transfer max" fill, so the field's native validation agrees with our cent-wise
   *  check (the raw maxAmount carries sub-cent noise that would flag the full amount). */
  get maxAmountCents(): number {
    return Math.round(this.data.maxAmount * 100) / 100;
  }

  /** Fill in the full available balance (rounded to cents for a clean display value). */
  setMax(): void {
    this.transferAmount = this.maxAmountCents;
  }

  /** Programmatic error text so keyboard/screen-reader users learn why the transfer
   *  is blocked (3.3.1 / 3.3.3), instead of only seeing the button disabled. */
  validationMessage(): string {
    if (this.transferAmount === null) { return ''; }
    if (this.transferAmount <= 0) { return 'Enter an amount greater than zero.'; }
    if (Math.round(this.transferAmount * 100) > Math.round(this.data.maxAmount * 100)) {
      return `Amount exceeds your available balance. Maximum: $${this.data.maxAmount.toFixed(2)}.`;
    }
    return '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onTransfer(): void {
    if (!this.submitting && this.isValidAmount() && this.transferAmount !== null) {
      // Transfer exactly the available balance when the entered amount rounds to the
      // full max (leaves the source at 0 and conserves money to the cent); otherwise
      // snap the entered amount to whole cents so no sub-cent noise enters the ledger.
      const amount = Math.round(this.transferAmount * 100) === Math.round(this.data.maxAmount * 100)
        ? this.data.maxAmount
        : Math.round(this.transferAmount * 100) / 100;

      const confirmationData: ConfirmationDialogData = {
        title: `Confirm ${this.dialogTitle}`,
        message: `Are you sure you want to ${this.data.transferDirection === 'to-brokerage' ? 'add' : 'withdraw'} these funds?`,
        confirmText: this.data.transferDirection === 'to-brokerage' ? 'Add Funds' : 'Withdraw Funds',
        cancelText: 'Cancel',
        type: 'transfer',
        transferData: {
          direction: this.data.transferDirection,
          amount: amount,
          fromAccount: this.data.transferDirection === 'to-brokerage' ? 'banking001' : 'brokerage001',
          toAccount: this.data.transferDirection === 'to-brokerage' ? 'brokerage001' : 'banking001'
        }
      };

      this.submitting = true;
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '500px',
        data: confirmationData
      });

      dialogRef.afterClosed().subscribe(confirmed => {
        if (confirmed) {
          this.dialogRef.close({ amount });
        } else {
          this.submitting = false;
        }
      });
    }
  }
}
