// Core modules
import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';

// Application components
import { ManageProfileComponent } from './manage-profile.component';
import { ManageProfileRoutingModule } from './manage-profile-routing.module';

@NgModule({
  declarations: [ManageProfileComponent],
  imports: [ManageProfileRoutingModule, SharedModule],
})
export class ManageProfileModule {}
