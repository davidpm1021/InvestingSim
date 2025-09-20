import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadCheckDialogComponent } from './upload-check-dialog.component';

describe('UploadCheckDialogComponent', () => {
  let component: UploadCheckDialogComponent;
  let fixture: ComponentFixture<UploadCheckDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UploadCheckDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadCheckDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
