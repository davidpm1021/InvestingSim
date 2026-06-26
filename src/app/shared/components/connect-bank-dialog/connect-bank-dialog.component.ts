import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LiveAnnouncer } from '@angular/cdk/a11y';

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
    accountHolder: 'Buck Moneybags',
    bankName: 'Evergreen Bank',
    routingNumber: '021000021',
    accountNumber: '•••• 1234',
    accountType: 'Checking'
  };

  status: ConnectStatus = 'review';

  constructor(
    private dialogRef: MatDialogRef<ConnectBankDialogComponent>,
    private live: LiveAnnouncer,
  ) {}

  connect(): void {
    this.status = 'connecting';
    // Lock the dialog once connecting starts: an ESC/backdrop dismissal mid-animation
    // would resolve undefined and leave the bank unlinked (guide stuck on this step).
    this.dialogRef.disableClose = true;
    // The status text is swapped in by *ngIf without moving focus, so announce each
    // transition for screen readers (WCAG 4.1.3 Status Messages).
    this.live.announce(`Securely connecting to ${this.bankDetails.bankName}`, 'polite');
    setTimeout(() => {
      this.status = 'connected';
      this.live.announce(`Connected to ${this.bankDetails.bankName}`, 'assertive');
      setTimeout(() => this.dialogRef.close(true), 900);
    }, 1300);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
