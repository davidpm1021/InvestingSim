// Core modules
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogData } from '../../deposit-check.component';

@Component({
  selector: 'app-upload-check-dialog',
  templateUrl: './upload-check-dialog.component.html',
  styleUrls: ['./upload-check-dialog.component.scss']
})
export class UploadCheckDialogComponent implements OnInit {

  constructor( public dialogRef: MatDialogRef<UploadCheckDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,) { }

  ngOnInit(): void {
  }

}
