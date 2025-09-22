import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../user.service';
import { UserTypeEnum } from '../types/enums/user-type.enum';
import { UserInterface } from '../types/user.interface';
import { uniqueEmailValidator } from 'src/app/shared/validators/unique-email.validator';
import { UserEditFormInterface } from '../types/user-edit-form.interface';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.css'],
})
export class UserEditComponent implements OnInit {
  userForm!: FormGroup<UserEditFormInterface>;
  isEditMode: boolean = false;
  userId!: number;
  UserType = UserTypeEnum;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initEditForm();
  }

  onSubmit() {
    if (this.userForm.invalid) return;

    const user: UserInterface = this.userForm.getRawValue();

    if (this.isEditMode) {
      this.userService.updateUser(user);
      alert('User updated successfully!');
    } else {
      this.userService.addUser(user);
      alert('User added successfully!');
    }
    this.router.navigate(['/users']);
  }

  onCancel() {
    this.router.navigate(['/users']);
  }
  private initEditForm(): void {
    this.userForm = this.fb.group({
      id: this.fb.control(0),
      name: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      age: this.fb.control(0, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.min(18),
          Validators.max(120),
        ],
      }),
      email: this.fb.control('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.email,
          uniqueEmailValidator(this.userService),
        ],
      }),
      phone: this.fb.control('', { nonNullable: true }),
      address: this.fb.control('', { nonNullable: true }),
      registeredDate: this.fb.control(new Date().toISOString().split('T')[0], {
        nonNullable: true,
      }),
      isActive: this.fb.control(false, { nonNullable: true }),
      role: this.fb.control(UserTypeEnum.User, {
        nonNullable: true,
        validators: [Validators.required],
      }),
    }) as FormGroup<UserEditFormInterface>;

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.userId = +id;
      const existingUser = this.userService.getUserById(this.userId);
      if (existingUser) {
        this.userForm.get('email')?.clearValidators();
        this.userForm
          .get('email')
          ?.addValidators([
            Validators.required,
            Validators.email,
            uniqueEmailValidator(this.userService, existingUser.email),
          ]);
        this.userForm.patchValue(existingUser);
      }
    }
  }
}
