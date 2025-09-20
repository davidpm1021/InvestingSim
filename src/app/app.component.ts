import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'investing-simulator';
  constructor(
    private router: Router
  ) {}

  ngOnInit() {
    let returnUrl = window.location.pathname.split('/bank-sim').join('');
    if (window.location.search) {
      returnUrl = '/'
    }
    this.router.navigate(['home'],{ queryParams: { returnUrl: returnUrl}});
  }
}
