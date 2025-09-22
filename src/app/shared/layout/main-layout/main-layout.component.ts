import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { DataService } from '../../services/data.service';
import { filter, interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, CommonModule],
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
    
    // Listen for route changes to update current route
    this.subscription.add(
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: NavigationEnd) => {
          this.simulatePageLoad();
          this.currentRoute = event.url;
        })
    );

    // Poll for admin options changes (since there's no observable for localStorage changes)
    this.subscription.add(
      interval(500).subscribe(() => {
        this.updateLayout();
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
        return 'https://ngpf.org/investing-sim';
      case '/banking':
        return 'https://www.wellsfargo.com/online-banking';
      case '/investing':
        return 'https://www.fidelity.com/investment-management';
      case '/admin':
        return 'https://ngpf.org/investing-sim/admin';
      default:
        return 'https://ngpf.org/investing-sim';
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
