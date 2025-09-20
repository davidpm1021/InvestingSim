// Core modules
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { SESSION_STORAGE } from '@shared/models/common';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
  ) { }

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): any {
    if (localStorage.getItem(SESSION_STORAGE.USER)) {
      return true;
    } else {
      localStorage.clear();
      this.router.navigate(['/home']);
    }
  }
}
