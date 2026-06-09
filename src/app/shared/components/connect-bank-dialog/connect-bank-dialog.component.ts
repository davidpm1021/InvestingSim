import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

type ConnectStatus = 'review' | 'connecting' | 'connected';

/**
 * Connect-bank onboarding dialog. Shows pre-filled (fictional) bank details the
 * student verifies, then a brief "connecting" animation and a success check.
 * Returns `true` on a successful connection. Follows the TransferDialog/Material
 * dialog pattern; no new theme.
 */
@Component({
  selector: 'app-connect-bank-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './connect-bank-dialog.component.html',
  styleUrl: './connect-bank-dialog.component.scss'
})
export class ConnectBankDialogComponent {
  // Pre-filled fictional details (verify-only — no typing). Account-type naming
  // (Checking → Savings) is intentionally generic here; renames land in Chunk 2.
  readonly bankDetails = {
    accountHolder: 'Sample Student',
    bankName: 'Evergreen Bank',
    routingNumber: '021000021',
    accountNumber: '•••• 1234',
    accountType: 'Checking'
  };

  status: ConnectStatus = 'review';

  constructor(private dialogRef: MatDialogRef<ConnectBankDialogComponent>) {}

  connect(): void {
    this.status = 'connecting';
    setTimeout(() => {
      this.status = 'connected';
      setTimeout(() => this.dialogRef.close(true), 900);
    }, 1300);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
