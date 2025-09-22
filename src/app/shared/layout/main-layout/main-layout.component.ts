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
          this.simulatePageLoad();
          this.currentRoute = event.url;
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
        return 'https://my-investing.example/investment';
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

  // Method to simulate page loading
  private simulatePageLoad(): void {
    if (this.currentLayout === 'web_browser') {
      this.isLoading = true;
      // Simulate loading time for different sites
      const loadingTime = this.getLoadingTime();
      setTimeout(() => {
        this.isLoading = false;
      }, loadingTime);
    }
  }

  // Method to get different loading times for different sites
  private getLoadingTime(): number {
    switch (this.currentRoute) {
      case '/banking':
        return 800; // Wells Fargo might be slower
      case '/investing':
        return 600; // Fidelity loads moderately
      case '/admin':
        return 400; // Admin panel loads quickly
      default:
        return 500; // Default loading time
    }
  }
}