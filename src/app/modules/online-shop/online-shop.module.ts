import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnlineShopComponent } from './online-shop.component';
import { OnlineShopRoutingModule } from './online-shop-routing.module';
import { SharedModule } from '@shared/shared.module';
import { MoneyQuizComponent } from './components/money-quiz/money-quiz.component';

@NgModule({
  declarations: [OnlineShopComponent, MoneyQuizComponent],
  imports: [CommonModule, OnlineShopRoutingModule, SharedModule],
})
export class OnlineShopModule {}
