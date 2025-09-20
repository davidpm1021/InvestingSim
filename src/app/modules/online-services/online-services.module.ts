// Core modules
import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';

// Application components
import { OnlineServicesComponent } from './online-services.component';
import { OnlineServicesRoutingModule } from './online-services-routing.module';

@NgModule({
  declarations: [OnlineServicesComponent],
  imports: [OnlineServicesRoutingModule, SharedModule],
})
export class OnlineServicesModule {}
