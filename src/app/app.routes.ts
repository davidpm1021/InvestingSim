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
    component: DesktopComponent,
    title: 'Investing Sim'
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'banking',
        component: BankingComponent,
        title: 'Evergreen Bank | Investing Sim'
      },
      {
        path: 'investing',
        component: InvestingComponent,
        title: 'Summit Invest | Investing Sim'
      },
      {
        path: 'admin',
        component: AdminComponent,
        title: 'Admin | Investing Sim'
      },
      {
        // Kept for teachers (reachable by direct URL); not surfaced in the student flow.
        path: 'bank-sim',
        component: BankSimComponent,
        title: 'Bank Sim | Investing Sim'
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
