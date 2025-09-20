import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfViewDialogComponent } from './pdf-view-dialog.component';

describe('PdfViewDialogComponent', () => {
  let component: PdfViewDialogComponent;
  let fixture: ComponentFixture<PdfViewDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PdfViewDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PdfViewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
