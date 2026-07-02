import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WalkthroughOverlayComponent } from './shared/components/walkthrough/walkthrough-overlay.component';
import { NotebookChecklistComponent } from './shared/components/notebook-checklist/notebook-checklist.component';
import { WalkthroughService } from './shared/services/walkthrough.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WalkthroughOverlayComponent, NotebookChecklistComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  constructor(private walkthrough: WalkthroughService) {}

  ngOnInit(): void {
    // Show the guided walkthrough on first visit (it stays closed once finished).
    this.walkthrough.autoStart();
  }
}
