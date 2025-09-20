// Core modules
import { Component, OnInit } from '@angular/core';

// Forms modules
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NOTIFICATIONS, SESSION_STORAGE } from '@shared/models/common';

export interface IUser {
  userName: string;
  password: string;
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  question1: string;
  question2: string;
  answer1: string;
  answer2: string;
}

@Component({
  selector: 'app-manage-profile',
  templateUrl: './manage-profile.component.html',
  styleUrls: ['./manage-profile.component.scss'],
})
export class ManageProfileComponent implements OnInit {
  public profileForm = new FormGroup({});
  user: IUser;

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      userName: new FormControl(''),
      password: new FormControl(''),
      fullName: new FormControl(''),
      address: new FormControl(''),
      city: new FormControl(''),
      state: new FormControl(''),
      zipCode: new FormControl(''),
      question1: new FormControl(''),
      question2: new FormControl(''),
      answer1: new FormControl(''),
      answer2: new FormControl(''),
      lowerLimit: new FormControl(NOTIFICATIONS.LOWER_LIMIT, [Validators.required]),
      upperLimit: new FormControl(NOTIFICATIONS.UPPER_LIMIT, [Validators.required])
    });
    this.getUserProfile();
  }

  get userName(): AbstractControl | null {
    return this.profileForm.get('userName');
  }

  get password(): AbstractControl | null {
    return this.profileForm.get('password');
  }

  get fullName(): AbstractControl | null {
    return this.profileForm.get('fullName');
  }

  get address(): AbstractControl | null {
    return this.profileForm.get('address');
  }

  get city(): AbstractControl | null {
    return this.profileForm.get('city');
  }

  get state(): AbstractControl | null {
    return this.profileForm.get('state');
  }

  get zipCode(): AbstractControl | null {
    return this.profileForm.get('zipCode');
  }

  get answer1(): AbstractControl | null {
    return this.profileForm.get('answer1');
  }

  get answer2(): AbstractControl | null {
    return this.profileForm.get('answer2');
  }

  getUserProfile(): void {
    const user = localStorage.getItem(SESSION_STORAGE.USER);
    if (user) {
      this.user = JSON.parse(user);
      this.profileForm.patchValue(this.user);
    }
    const notifications = localStorage.getItem(SESSION_STORAGE.NOTIFICATIONS);
    if (notifications) {
      const details = JSON.parse(notifications);
      this.profileForm.patchValue(details);
    }
  }

  save(): void {
    const notifications = {
      upperLimit: this.profileForm.value.upperLimit,
      lowerLimit: this.profileForm.value.lowerLimit
    }
    localStorage.setItem(SESSION_STORAGE.NOTIFICATIONS, JSON.stringify(notifications));
    this.router.navigate(['']);
  }
}
