import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DataService } from '../../shared/services/data.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  // Static placeholder values
  portfolioValue: number = 100000;
  cashBalance: number = 25000;
  totalReturn: number = 5.25;
  currentDate: string = '2025-01-01';
  private subscription = new Subscription();

  constructor(public dataService: DataService) {}

  ngOnInit(): void {
    // Subscribe to current date changes
    this.subscription.add(
      this.dataService.currentDate$.subscribe(date => {
        this.currentDate = date;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
