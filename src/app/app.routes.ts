import { Routes } from '@angular/router';
import { DesktopComponent } from './pages/desktop/desktop.component';
import { MainLayoutComponent } from './shared/layout/main-layout/main-layout.component';
import { BankingComponent } from './features/banking/banking.component';
import { InvestingComponent } from './features/investing/investing.component';
import { AdminComponent } from './features/admin/admin.component';
import { BankSimComponent } from './features/bank-sim/bank-sim.component';

export const routes: Routes = [
  {
    path: '',
    component: DesktopComponent
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'banking',
        component: BankingComponent
      },
      {
        path: 'investing',
        component: InvestingComponent
      },
      {
        path: 'admin',
        component: AdminComponent
      },
      {
        // Kept for teachers (reachable by direct URL); not surfaced in the student flow.
        path: 'bank-sim',
        component: BankSimComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
