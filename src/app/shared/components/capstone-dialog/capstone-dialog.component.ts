import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TransactionsService } from '../../services/transactions.service';
import { HoldingsService } from '../../services/holdings.service';
import { DataService } from '../../services/data.service';
import { CurrentDateService } from '../../services/current-date.service';

/**
 * Year-End Review capstone — a headline summary of the full year, shown when the
 * student reaches the Year-End Review. Reuses the same service primitives as the
 * statement (ledger, holdings value, allocation weights). No worksheet handoff.
 */
@Component({
  selector: 'app-capstone-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './capstone-dialog.component.html',
  styleUrl: './capstone-dialog.component.scss'
})
export class CapstoneDialogComponent implements OnInit {
  model: any = null;

  constructor(
    public dialogRef: MatDialogRef<CapstoneDialogComponent>,
    private transactionsService: TransactionsService,
    private holdingsService: HoldingsService,
    private dataService: DataService,
    private currentDateService: CurrentDateService
  ) {}

  ngOnInit(): void {
    const asOf = this.currentDateService.getCurrentDate();
    const cash = this.transactionsService.getBalanceAtDate('brokerage001', asOf);
    const investments = this.holdingsService.getInvestmentsValueAtDate(asOf);
    const finalValue = cash + investments;

    const ledger = this.transactionsService.getLedgerAsOf(asOf).filter(t => t.account === 'brokerage001');
    const deposits = ledger.filter(t => t.type === 'transaction' && t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const withdrawn = ledger.filter(t => t.type === 'transaction' && t.amount < 0).reduce((s, t) => s - t.amount, 0);
    const dividends = ledger.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const interest = ledger.filter(t => t.type === 'interest').reduce((s, t) => s + t.amount, 0);

    // Gain = what you still hold PLUS anything withdrawn back to Savings, minus what you
    // deposited (value earned over your net contributions). Return % is that gain over
    // net contributions (deposits - withdrawals), matching the Overview. Null (shown as a
    // dash) when net contributions are <= 0 — you have withdrawn at least as much as you
    // put in, so a percentage is undefined.
    const netContributions = deposits - withdrawn;
    const gainLoss = finalValue + withdrawn - deposits;
    const gainLossPct = netContributions > 0 ? (gainLoss / netContributions) * 100 : null;

    const { stocks, bonds } = this.dataService.getAssetClassTotals(
      this.holdingsService.getHoldingDetailsAtDate(asOf)
    );
    const total = finalValue || 1;

    this.model = {
      finalValue,
      added: deposits,
      withdrawn,
      gainLoss,
      gainLossPct,
      incomeTotal: dividends + interest,
      allocation: [
        { label: 'Stocks', pct: (stocks / total) * 100 },
        { label: 'Bonds', pct: (bonds / total) * 100 },
        { label: 'Cash', pct: (cash / total) * 100 }
      ]
    };
  }

  close(): void {
    this.dialogRef.close();
  }

  // ---- "Copy image" (for pasting the summary into a doc) ----

  copyBusy = false;
  copyStatus = '';

  private static readonly IMG_W = 720;
  private static readonly INK = '#0b1541';
  private static readonly LABEL = '#41496b';
  private static readonly MUTED = '#5a6480';
  private static readonly POS = '#0f7a4f';
  private static readonly NEG = '#c0322b';

  private money(n: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  }

  /** Rows mirroring the on-screen summary, so the image says the same thing. */
  private imageRows(): Array<{ label: string; value: string; color?: string }> {
    const m = this.model;
    const rows: Array<{ label: string; value: string; color?: string }> = [
      { label: 'Account value', value: this.money(m.finalValue) },
      { label: 'Deposits', value: this.money(m.added) },
    ];
    if (m.withdrawn > 0) {
      rows.push({ label: 'Withdrawals', value: this.money(m.withdrawn) });
    }
    const pct = m.gainLossPct === null ? '–' : `${m.gainLossPct.toFixed(2)}%`;
    rows.push({
      label: 'Total gain / loss',
      value: `${m.gainLoss >= 0 ? '+' : ''}${this.money(m.gainLoss)} (${pct})`,
      color: m.gainLoss >= 0 ? CapstoneDialogComponent.POS : CapstoneDialogComponent.NEG,
    });
    rows.push({ label: 'Income earned (dividends + interest)', value: this.money(m.incomeTotal) });
    return rows;
  }

  /**
   * Draw the summary onto a canvas. Purpose-built rather than a DOM screenshot, so
   * the result is crisp at 2x and reads cleanly pasted into a document.
   */
  private async renderCard(): Promise<HTMLCanvasElement> {
    const W = CapstoneDialogComponent.IMG_W;
    const rows = this.imageRows();
    const alloc = this.model.allocation as Array<{ label: string; pct: number }>;

    const padX = 44;
    const ROW = 38, ALLOC_ROW = 32;
    const H = 96 + 26 + rows.length * ROW + 34 + 28 + alloc.length * ALLOC_ROW + 40;

    // Montserrat is a webfont; ask for the weights we draw with before painting, or
    // the canvas silently falls back to the generic sans.
    const fonts: any = (document as any).fonts;
    if (fonts?.load) {
      try {
        await Promise.all([
          fonts.load('700 30px Montserrat'), fonts.load('600 16px Montserrat'),
          fonts.load('700 16px Montserrat'), fonts.load('400 15px Montserrat'),
        ]);
      } catch { /* fall back to the generic sans */ }
    }

    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    const F = (w: number, s: number) => `${w} ${s}px Montserrat, Helvetica, Arial, sans-serif`;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#275ce4';
    ctx.fillRect(0, 0, W, 6);
    ctx.strokeStyle = '#dfe5f3';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    let y = 56;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0d1157';
    ctx.font = F(700, 30);
    ctx.fillText('Year-End Review', padX, y);

    y += 26;
    ctx.fillStyle = CapstoneDialogComponent.MUTED;
    ctx.font = F(400, 15);
    ctx.fillText('Your investing year at a glance', padX, y);

    y += 26;
    ctx.strokeStyle = '#e6ebf7';
    ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(W - padX, y); ctx.stroke();

    y += 30;
    for (const r of rows) {
      ctx.textAlign = 'left';
      ctx.fillStyle = CapstoneDialogComponent.LABEL;
      ctx.font = F(400, 15);
      ctx.fillText(r.label, padX, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = r.color || CapstoneDialogComponent.INK;
      ctx.font = F(700, 16);
      ctx.fillText(r.value, W - padX, y);
      y += ROW;
    }

    y += 6;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0d1157';
    ctx.font = F(700, 16);
    ctx.fillText('Where you ended up', padX, y);
    y += 28;

    for (const a of alloc) {
      ctx.textAlign = 'left';
      ctx.fillStyle = CapstoneDialogComponent.LABEL;
      ctx.font = F(400, 15);
      ctx.fillText(a.label, padX, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = CapstoneDialogComponent.INK;
      ctx.font = F(600, 16);
      ctx.fillText(`${a.pct.toFixed(2)}%`, W - padX, y);
      y += ALLOC_ROW;
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = '#8b94ad';
    ctx.font = F(600, 12);
    ctx.fillText('NGPF Investing Sim', padX, H - 24);

    return canvas;
  }

  private download(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'year-end-review.png';
    a.click();
    // Revoke on the next tick so the click has taken the URL.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  /**
   * Put the summary on the clipboard as a PNG so it can be pasted straight into a
   * doc. Clipboard image writes need a secure context and browser support, so fall
   * back to downloading the same image rather than failing silently.
   */
  async copyImage(): Promise<void> {
    if (this.copyBusy || !this.model) { return; }
    this.copyBusy = true;
    this.copyStatus = '';
    try {
      const canvas = await this.renderCard();
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
      if (!blob) { throw new Error('Could not encode the image.'); }

      let copied = false;
      const CI = (window as any).ClipboardItem;
      if (CI && navigator.clipboard?.write) {
        try {
          await navigator.clipboard.write([new CI({ 'image/png': blob })]);
          copied = true;
        } catch { copied = false; }
      }

      if (copied) {
        this.copyStatus = 'Copied. Paste it into your document.';
      } else {
        this.download(blob);
        this.copyStatus = 'Copying was blocked, so the image was downloaded instead.';
      }
    } catch {
      this.copyStatus = 'Sorry, the image could not be created.';
    } finally {
      this.copyBusy = false;
    }
  }
}
