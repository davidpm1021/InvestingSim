import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from '../../shared/components/header/header.component';

/**
 * Desktop entry screen. The NGPF header stays pinned at the top (consistent with
 * the rest of the app); below it is a faux OS desktop. "Opening" the browser
 * navigates into the brokerage (Summit Invest) inside the faux-browser layout.
 */
@Component({
  selector: 'app-desktop',
  standalone: true,
  imports: [MatIconModule, HeaderComponent],
  templateUrl: './desktop.component.html',
  styleUrl: './desktop.component.scss'
})
export class DesktopComponent {
  constructor(private router: Router) {}

  openBrowser(): void {
    this.router.navigate(['/investing']);
  }
}
