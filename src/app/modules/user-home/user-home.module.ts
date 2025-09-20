// Core modules
import { NgModule } from '@angular/core';

// Application components
import { UserHomeComponent } from './user-home.component';
import { UserHomeRoutingModule } from './user-home-routing.module';
import { SharedModule } from '@shared/shared.module';

@NgModule({
  declarations: [
    UserHomeComponent
  ],
  imports: [
    UserHomeRoutingModule,
    SharedModule
  ]
})
export class UserHomeModule { }
