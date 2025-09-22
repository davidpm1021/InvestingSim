import { Routes } from '@angular/router';
import { SplashComponent } from './pages/splash/splash.component';
import { MainLayoutComponent } from './shared/layout/main-layout/main-layout.component';
import { HomeComponent } from './features/home/home.component';
import { BankingComponent } from './features/banking/banking.component';
import { InvestingComponent } from './features/investing/investing.component';
import { AdminComponent } from './features/admin/admin.component';
import { BankSimComponent } from './features/bank-sim/bank-sim.component';

export const routes: Routes = [
  {
    path: '',
    component: SplashComponent
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'home',
        component: HomeComponent
      },
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
