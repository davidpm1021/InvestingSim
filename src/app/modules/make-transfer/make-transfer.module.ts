// Core modules
import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';

// Application components
import { DisplayAllTransfersComponent } from './components/display-all-transfers/display-all-transfers.component';
import { MakeTransferComponent } from './make-transfer.component';
import { MakeTransferRoutingModule } from './make-transfer-routing.module';

@NgModule({
  declarations: [
    MakeTransferComponent,
    DisplayAllTransfersComponent
  ],
  imports: [
    MakeTransferRoutingModule,
    SharedModule
  ]
})
export class MakeTransferModule { }
