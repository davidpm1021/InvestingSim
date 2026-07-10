import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WalkthroughOverlayComponent } from './shared/components/walkthrough/walkthrough-overlay.component';
import { NotebookChecklistComponent } from './shared/components/notebook-checklist/notebook-checklist.component';
import { WalkthroughService } from './shared/services/walkthrough.service';
import { MatIconRegistry } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WalkthroughOverlayComponent, NotebookChecklistComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  constructor(private walkthrough: WalkthroughService, iconRegistry: MatIconRegistry) {
    // NGPF uses FontAwesome 6 Solid; make every <mat-icon> render an FA glyph
    // (icons are set via fontIcon="fa-...", so sizing/alignment stay unchanged).
    iconRegistry.setDefaultFontSetClass('fa-solid');
  }

  ngOnInit(): void {
    // Show the guided walkthrough on first visit (it stays closed once finished).
    this.walkthrough.autoStart();
  }
}
