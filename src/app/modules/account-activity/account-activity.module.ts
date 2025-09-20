// Core modules
import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';

// Application components
import { AccountActivityComponent } from './account-activity.component';
import { MonthlyStatementComponent } from './components/monthly-statement/monthly-statement.component';
import { ViewStatementComponent } from './components/view-statement/view-statement.component';
import { ViewAccountDialogComponent } from './components/view-account-dialog/view-account-dialog.component';
import { AccountActivityRoutingModule } from './account-activity-routing.module';

@NgModule({
  declarations: [
    AccountActivityComponent,
    MonthlyStatementComponent,
    ViewStatementComponent,
    ViewAccountDialogComponent,
  ],
  imports: [
    SharedModule,
    AccountActivityRoutingModule
  ],
  entryComponents: [
    ViewAccountDialogComponent
  ]
})
export class AccountActivityModule { }
