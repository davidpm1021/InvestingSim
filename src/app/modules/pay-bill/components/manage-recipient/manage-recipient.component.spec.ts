import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageRecipientComponent } from './manage-recipient.component';

describe('ManageRecipientComponent', () => {
  let component: ManageRecipientComponent;
  let fixture: ComponentFixture<ManageRecipientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageRecipientComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageRecipientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
