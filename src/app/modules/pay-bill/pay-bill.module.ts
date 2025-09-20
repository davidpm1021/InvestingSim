// Core modules
import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { PayBillRoutingModule } from './pay-bill-routing.module';

// Application components
import { PayBillComponent } from './pay-bill.component';
import { ManageRecipientComponent } from './components/manage-recipient/manage-recipient.component';
import { AddRecipientDialogComponent } from './components/add-recipient-dialog/add-recipient-dialog.component';
import { DisplayBillsComponent } from './components/display-bills/display-bills.component';

@NgModule({
  declarations: [PayBillComponent, ManageRecipientComponent, AddRecipientDialogComponent, DisplayBillsComponent],
  imports: [PayBillRoutingModule, SharedModule],
})
export class PayBillModule {}
