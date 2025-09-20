// Core modules
import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';

// Application components
import { MainComponent } from './main.component';
import { MenuListItemComponent } from './components/menu-list-item/menu-list-item.component';
import { MainRoutingModule } from './main-routing.module';
import { HeaderModule } from '../header/header.module';

@NgModule({
  declarations: [
    MainComponent,
    MenuListItemComponent,
  ],
  imports: [
    SharedModule,
    MainRoutingModule,
    HeaderModule
  ]
})
export class MainModule { }
