import { MakeTransferComponent } from './make-transfer.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DisplayAllTransfersComponent } from './components/display-all-transfers/display-all-transfers.component';

const routes: Routes = [
  {
    path: '',
    component: MakeTransferComponent,
  },
  {
    path: 'display-transfers',
    component: DisplayAllTransfersComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MakeTransferRoutingModule {}
