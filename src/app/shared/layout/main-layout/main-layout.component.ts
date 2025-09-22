import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from '../../components/header/header.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { DataService } from '../../services/data.service';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, CommonModule, MatIconModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  currentLayout: 'default' | 'web_browser' = 'default';
  currentRoute: string = '';
  isLoading: boolean = false;
  currentInvestingTab: string = '';
  private subscription = new Subscription();

  constructor(
    private dataService: DataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get initial layout setting
    this.updateLayout();
    
    // Set initial route on page load/refresh
    this.currentRoute = this.router.url;
    
    // Listen for route changes to update current route
    this.subscription.add(
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: NavigationEnd) => {
          this.currentRoute = event.url;
          // Clear investing tab when navigating away from investing page
          if (event.url !== '/investing') {
            this.currentInvestingTab = '';
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private updateLayout(): void {
    const options = this.dataService.getOptions();
    const newLayout = options.layout;
    if (newLayout !== this.currentLayout) {
      this.currentLayout = newLayout;
    }
  }

  // Method to get current URL for address bar
  getCurrentUrl(): string {
    switch (this.currentRoute) {
      case '/home':
        return 'https://investing-sim.example';
      case '/banking':
        return 'https://my-bank.example/online-banking';
      case '/investing':
        const baseUrl = 'https://my-investing.example/investment';
        return this.currentInvestingTab ? `${baseUrl}/${this.currentInvestingTab}` : baseUrl;
      case '/admin':
        return 'https://investing-sim.example/admin';
      default:
        return 'https://investing-sim.example';
    }
  }

  // Method to navigate to different routes (for browser tabs)
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  // Method to update the current investing tab (called by investing component)
  updateInvestingTab(tabName: string): void {
    this.currentInvestingTab = tabName;
  }

  // Browser navigation methods (placeholder for now)
  goBack(): void {
    // Placeholder - could implement browser history
    console.log('Back button clicked');
  }

  goForward(): void {
    // Placeholder - could implement browser history
    console.log('Forward button clicked');
  }

  refresh(): void {
    // Reload current route
    window.location.reload();
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  // Method to check if URL is secure (HTTPS)
  isSecureUrl(): boolean {
    return this.getCurrentUrl().startsWith('https://');
  }

}