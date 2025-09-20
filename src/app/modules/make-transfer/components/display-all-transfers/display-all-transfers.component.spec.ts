import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayAllTransfersComponent } from './display-all-transfers.component';

describe('DisplayAllTransfersComponent', () => {
  let component: DisplayAllTransfersComponent;
  let fixture: ComponentFixture<DisplayAllTransfersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DisplayAllTransfersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayAllTransfersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
