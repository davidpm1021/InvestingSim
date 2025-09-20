// Core modules
import { Component, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-pdf-view-dialog',
  templateUrl: './pdf-view-dialog.component.html',
  styleUrls: ['./pdf-view-dialog.component.scss'],
})
export class PdfViewDialogComponent implements OnInit {
  public blob: Blob;
  @ViewChild('pdfViewerOnDemand') public pdfViewerOnDemand: { pdfSrc: any; refresh: () => void; };
  public spinner = false;
  @Input() public isDialog = true;
  @Input() public code: string;
  public pdfUrl: SafeResourceUrl;

  constructor(
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  public ngOnInit(): void {
    this.setPDF();
  }

  private setPDF() {
    const blobURL = URL.createObjectURL(this.data.pdfSrc);
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobURL);
  }

}
