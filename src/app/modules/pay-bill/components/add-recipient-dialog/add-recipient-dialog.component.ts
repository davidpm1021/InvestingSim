// Core modules
import { Component, Inject, OnInit } from '@angular/core';

// Angular forms
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonService } from '@core/services/common.service';

// Services
import { NotificationsService } from '@core/services/notifications.service';
import { IDS, MESSAGES, SESSION_STORAGE } from '@shared/models/common';
import { Subscription } from 'rxjs';

export interface IRecipient {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

@Component({
  selector: 'app-add-recipient-dialog',
  templateUrl: './add-recipient-dialog.component.html',
  styleUrls: ['./add-recipient-dialog.component.scss'],
})
export class AddRecipientDialogComponent implements OnInit {
  recipientForm: FormGroup;
  recipientList: IRecipient[] = [];
  private subscription = new Subscription();
  private addressList: any;

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationsService,
    private dialogRef: MatDialogRef<AddRecipientDialogComponent>,
    private commonService: CommonService,
    @Inject(MAT_DIALOG_DATA) public data: IRecipient
  ) {}

  ngOnInit(): void {
    this.recipientForm = this.fb.group({
      id: new FormControl(IDS.RECIPIENT),
      name: new FormControl(null, [Validators.required]),
      address1: new FormControl(),
      city: new FormControl(),
      state: new FormControl(),
      zip: new FormControl(),
    });

    const recipientList = localStorage.getItem(SESSION_STORAGE.RECIPIENT);
    if (recipientList) {
      this.recipientList = JSON.parse(recipientList);
    }

    if (this.data) {
      this.recipientForm.patchValue(this.data);
    } else {
      this.getAddressList();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getAddressList(): void {
    this.subscription = this.commonService.getAddressList().subscribe(data => {
       this.addressList = data;
       const randomAddress  = this.addressList[this.recipientList.length % 100];
       this.recipientForm.patchValue(randomAddress);
    })
  }

  submit(): void {
    if (this.data) {
      const index = this.recipientList.findIndex((recipient) => recipient.id === this.data.id);
      this.recipientList[index].name = this.recipientForm.value.name;
      localStorage.setItem(SESSION_STORAGE.RECIPIENT, JSON.stringify(this.recipientList));
      this.notificationService.showSuccess(MESSAGES.RECIPIENT, '');
    } else {
      if (this.recipientList.length) {
        const lastRecord = this.recipientList[this.recipientList.length - 1];
        const currentRecord = {
          ...this.recipientForm.value,
          id: lastRecord.id + 1,
        };
        this.recipientList.push(currentRecord);
        localStorage.setItem(SESSION_STORAGE.RECIPIENT, JSON.stringify(this.recipientList));
      } else {
        localStorage.setItem(SESSION_STORAGE.RECIPIENT, JSON.stringify([this.recipientForm.value]));
      }
      this.notificationService.showSuccess(MESSAGES.RECIPIENT_UPDATE, '');
    }
    this.dialogRef.close(this.recipientForm.value.name);
  }
}
