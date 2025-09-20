import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoneyQuizComponent } from './money-quiz.component';

describe('MoneyQuizComponent', () => {
  let component: MoneyQuizComponent;
  let fixture: ComponentFixture<MoneyQuizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MoneyQuizComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MoneyQuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
