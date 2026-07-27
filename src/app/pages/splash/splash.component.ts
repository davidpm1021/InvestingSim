import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

/**
 * Welcome splash, the first thing a student sees. Modeled on the NGPF Online Bank
 * Simulator's landing screen: a full-bleed branded background with a white card
 * that says what the tool is and what you can do, plus two ways in.
 *
 * "Get Started" enters through the faux desktop (the guided flow: open the browser
 * to reach Summit Invest). Progress persists in localStorage, so returning
 * students pick up where they left off.
 */
@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './splash.component.html',
  styleUrl: './splash.component.scss',
})
export class SplashComponent {
  constructor(private router: Router) {}

  getStarted(): void {
    this.router.navigate(['/desktop']);
  }
}
