// Core modules
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

// Services
import { NavigationService } from '@core/services/navigation.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
  opened = true;

  @ViewChild('sidenav', { static: true }) appDrawer: ElementRef;

  navItems: any = [
    {
      displayName: 'HOME',
      iconName: 'home-icon',
      route: '',
    },
    {
      displayName: 'NOTIFICATIONS',
      iconName: 'notification-icon',
      route: 'notifications',
    },
    {
      displayName: 'ACCOUNTS',
      iconName: 'account-icon',
      children: [
        {
          displayName: 'ACCOUNT ACTIVITY',
          iconName: 'More-icon',
          route: 'account',
        },
        {
          displayName: 'MONTHLY STATEMENT',
          iconName: 'More-icon',
          route: 'account/monthly',
        },
      ],
    },
    {
      displayName: 'TRANSFERS',
      iconName: 'transfer-icon',
      children: [
        {
          displayName: 'MAKE A TRANSFER',
          iconName: 'More-icon',
          route: 'transfer',
        },
        {
          displayName: 'DISPLAY ALL TRANSFERS',
          iconName: 'More-icon',
          route: 'transfer/display-transfers',
        },
      ],
    },
    {
      displayName: 'BILLS',
      iconName: 'pay-bill-icon',
      children: [
        {
          displayName: 'PAY BILL',
          iconName: 'More-icon',
          route: 'pay-bill',
        },
        {
          displayName: 'DISPLAY ALL BILLS',
          iconName: 'More-icon',
          route: 'pay-bill/display-bills',
        },
        {
          displayName: 'MANAGE RECIPIENT',
          iconName: 'More-icon',
          route: 'pay-bill/manage-recipient',
        },
      ],
    },
    {
      displayName: 'DEPOSIT CHECKS',
      iconName: 'deposit-check-icon',
      route: 'deposit-check',
    },
    {
      displayName: 'ONLINE SERVICES',
      iconName: 'online-services-icon',
      route: 'online-services',
    },
    {
      displayName: 'MANAGE PROFILE',
      iconName: 'manage-profile',
      route: 'manage-profile',
    },
    {
      displayName: 'SHOPPING',
      iconName: 'shopping-icon',
      route: 'online-shop',
    },
  ];


  constructor(private navService: NavigationService) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.navService.appDrawer = this.appDrawer;
  }
}
