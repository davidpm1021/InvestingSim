// Core modules
import { Injectable } from '@angular/core';
import { Event, NavigationEnd, Router } from '@angular/router';

// Third party modules
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {

  public appDrawer: any;
  public currentUrl = new BehaviorSubject<string>('undefined');

  constructor(private router: Router) {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.currentUrl.next(event.urlAfterRedirects);
      }
    });
  }

  public closeNav() {
    if (this.appDrawer) {
      this.appDrawer.close();
    }
  }

  public openNav() {
    this.appDrawer.open();
  }
}
