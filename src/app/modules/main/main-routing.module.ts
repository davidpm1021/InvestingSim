import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main.component';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('../../modules/user-home/user-home.module').then(
            (m) => m.UserHomeModule
          ),
      },
      {
        path: 'account',
        loadChildren: () =>
          import('../../modules/account-activity/account-activity.module').then(
            (m) => m.AccountActivityModule
          ),
      },
      {
        path: 'notifications',
        loadChildren: () =>
          import('../../modules/notification/notification.module').then(
            (m) => m.NotificationModule
          ),
      },
      {
        path: 'transfer',
        loadChildren: () =>
          import('../../modules/make-transfer/make-transfer.module').then(
            (m) => m.MakeTransferModule
          ),
      },
      {
        path: 'pay-bill',
        loadChildren: () =>
          import('../../modules/pay-bill/pay-bill.module').then(
            (m) => m.PayBillModule
          ),
      },
      {
        path: 'deposit-check',
        loadChildren: () =>
          import('../../modules/deposit-check/deposit-check.module').then(
            (m) => m.DepositCheckModule
          ),
      },
      {
        path: 'online-shop',
        loadChildren: () =>
          import('../../modules/online-shop/online-shop.module').then(
            (m) => m.OnlineShopModule
          ),
      },
      {
        path: 'online-services',
        loadChildren: () =>
          import('../../modules/online-services/online-services.module').then(
            (m) => m.OnlineServicesModule
          ),
      },
      {
        path: 'manage-profile',
        loadChildren: () =>
          import('../../modules/manage-profile/manage-profile.module').then(
            (m) => m.ManageProfileModule
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MainRoutingModule {}
