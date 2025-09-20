import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRecipientDialogComponent } from './add-recipient-dialog.component';

describe('AddRecipientDialogComponent', () => {
  let component: AddRecipientDialogComponent;
  let fixture: ComponentFixture<AddRecipientDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddRecipientDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddRecipientDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
