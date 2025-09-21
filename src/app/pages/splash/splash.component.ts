import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './splash.component.html',
  styleUrl: './splash.component.scss'
})
export class SplashComponent {
  constructor(private router: Router) {}

  startApp() {
    this.router.navigate(['/home']);
  }
}
