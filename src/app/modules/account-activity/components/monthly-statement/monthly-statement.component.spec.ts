import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyStatementComponent } from './monthly-statement.component';

describe('MonthlyStatementComponent', () => {
  let component: MonthlyStatementComponent;
  let fixture: ComponentFixture<MonthlyStatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MonthlyStatementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthlyStatementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
