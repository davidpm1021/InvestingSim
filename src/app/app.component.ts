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
    // Line Awesome Solid (design update); every <mat-icon fontIcon="la-..."> renders
    // a Line Awesome glyph. `las` is the solid base class.
    iconRegistry.setDefaultFontSetClass('las');
  }

  ngOnInit(): void {
    // Show the guided walkthrough on first visit (it stays closed once finished).
    this.walkthrough.autoStart();
  }
}
