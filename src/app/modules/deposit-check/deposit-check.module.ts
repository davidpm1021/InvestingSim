// Core modules
import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';

// Application components
import { DepositCheckComponent } from './deposit-check.component';
import { UploadCheckDialogComponent } from './components/upload-check-dialog/upload-check-dialog.component';
import { DepositCheckRoutingModule } from './deposit-check-routing.module';

@NgModule({
  declarations: [DepositCheckComponent, UploadCheckDialogComponent],
  imports: [DepositCheckRoutingModule, SharedModule],
})
export class DepositCheckModule {}
