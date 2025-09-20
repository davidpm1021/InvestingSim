// Core module
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular forms
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Application component
import { PdfViewDialogComponent } from './components/pdf-view-dialog/pdf-view-dialog.component';
import { ChooseAccountComponent } from './components/choose-account/choose-account.component';
import { GenericTableComponent } from './components/generic-table/generic-table.component';
import { FlexLayoutModule } from '@angular/flex-layout';

// Material module
import { AppMaterialModule } from '@app/app-material.module';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { WelcomeDialogComponent } from './components/welcome-dialog/welcome-dialog.component';

@NgModule({
  declarations: [
    GenericTableComponent,
    PdfViewDialogComponent,
    ChooseAccountComponent,
    ConfirmationDialogComponent,
    WelcomeDialogComponent,
  ],
  imports: [
    CommonModule,
    AppMaterialModule,
    FlexLayoutModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    CommonModule,
    GenericTableComponent,
    AppMaterialModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    PdfViewDialogComponent,
    ChooseAccountComponent,
  ],
  providers: [
  ]
})
export class SharedModule {}
