// Core modules
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Application components
import { NotificationComponent } from './notification.component';
import { NotificationRoutingModule } from './notification-routing.module';
import { SharedModule } from '@app/shared/shared.module';

@NgModule({
  declarations: [
    NotificationComponent
  ],
  imports: [
    CommonModule,
    NotificationRoutingModule,
    SharedModule,
  ]
})
export class NotificationModule { }
