import { ViewStatementComponent } from './components/view-statement/view-statement.component';
import { MonthlyStatementComponent } from './components/monthly-statement/monthly-statement.component';
import { AccountActivityComponent } from './account-activity.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: AccountActivityComponent,
  },
  {
    path: 'monthly',
    component: MonthlyStatementComponent,
  },
  {
    path: 'view-statement',
    component: ViewStatementComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AccountActivityRoutingModule {}
