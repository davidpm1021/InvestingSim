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
  isMaximized: boolean = false;
  isMinimized: boolean = false;
  isClosing: boolean = false;
  hasAccessedAdmin: boolean = false;
  hasAccessedBankSim: boolean = false;
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
    // Set hasAccessedAdmin to true if already on admin page
    if (this.currentRoute === '/admin') {
      this.hasAccessedAdmin = true;
    }
    // Set hasAccessedBankSim to true if already on bank-sim page
    if (this.currentRoute === '/bank-sim') {
      this.hasAccessedBankSim = true;
    }
    
    // Listen for route changes to update current route
    this.subscription.add(
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: NavigationEnd) => {
          this.currentRoute = event.url;
          // Set hasAccessedAdmin to true when navigating to admin page
          if (event.url === '/admin') {
            this.hasAccessedAdmin = true;
          }
          // Set hasAccessedBankSim to true when navigating to bank-sim page
          if (event.url === '/bank-sim') {
            this.hasAccessedBankSim = true;
          }
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
      case '/bank-sim':
        return 'https://www.ngpf.org/bank-sim';
      default:
        return 'https://investing-sim.example';
    }
  }

  // Method to navigate to different routes (for browser tabs)
  navigateTo(route: string): void {
    if (route === '/admin') {
      this.hasAccessedAdmin = true;
    }
    if (route === '/bank-sim') {
      this.hasAccessedBankSim = true;
    }
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

  // Browser window control methods
  minimizeWindow(): void {
    this.isMinimized = true;
    this.isMaximized = false; // Can't be both maximized and minimized
  }

  maximizeWindow(): void {
    this.isMaximized = true;
    this.isMinimized = false; // Can't be both maximized and minimized
  }

  restoreWindow(): void {
    this.isMaximized = false;
    this.isMinimized = false;
  }

  restoreFromMinimized(): void {
    this.isMinimized = false;
  }

  closeWindow(): void {
    // Trigger the shake animation
    this.isClosing = true;
    
    // After animation completes, restore to original state
    setTimeout(() => {
      this.isClosing = false;
    }, 800); // Animation duration
  }

}