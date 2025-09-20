import { DisplayBillsComponent } from './components/display-bills/display-bills.component';
import { ManageRecipientComponent } from './components/manage-recipient/manage-recipient.component';
import { PayBillComponent } from './pay-bill.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: PayBillComponent,
  },
  {
    path: 'manage-recipient',
    component: ManageRecipientComponent,
  },
  {
    path: 'display-bills',
    component: DisplayBillsComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PayBillRoutingModule {}
