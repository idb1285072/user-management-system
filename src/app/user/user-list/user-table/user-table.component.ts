import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { UserFormInterface } from '../../types/user-form.interface';
import { UserInterface } from '../../types/user.interface';
import { UserTypeEnum } from '../../types/enums/user-type.enum';
import { ChildUserFormInterface } from '../../types/child-user-form.interface';
import { bulkUniqueEmailValidator } from 'src/app/shared/validators/bulk-unique-email.validator';
import { UsersFormInterface } from '../../types/users-form.interface';
import { uniqueEmailValidator } from 'src/app/shared/validators/unique-email.validator';
import { UserService } from '../../user.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-user-table',
  templateUrl: './user-table.component.html',
  styleUrls: ['./user-table.component.css'],
})
export class UserTableComponent {
  @Input() displayedUsers: UserInterface[] = [];
  @Input() currentPage = 1;
  @Input() itemsPerPage = 5;
  @Input() isBulkMode = false;
  @Input() roleOptions: UserTypeEnum[] = [];
  @Input() displayedUserEmails: string[] = [];

  @Output() refreshRequested = new EventEmitter<void>();
  @Output() bulkModeChange = new EventEmitter<boolean>();
  @Output() editUserRequest = new EventEmitter<number>();

  private destroy$ = new Subject<void>();
  usersForm!: FormGroup<UsersFormInterface>;
  inlineEditIndexes = new Set<number>();
  editingCell: { rowIndex: number; field: string } | null = null;
  addColumnUserId: number | null = null;
  addColumnForm!: FormGroup<ChildUserFormInterface>;
  userTypeEnum = UserTypeEnum;
  getRoleClass: Record<UserTypeEnum, string> = {
    [UserTypeEnum.SuperAdmin]: 'bg-dark',
    [UserTypeEnum.Admin]: 'bg-primary',
    [UserTypeEnum.Moderator]: 'bg-warning',
    [UserTypeEnum.Editor]: 'bg-info',
    [UserTypeEnum.Author]: 'bg-success',
    [UserTypeEnum.Contributor]: 'bg-secondary',
    [UserTypeEnum.User]: 'bg-light text-dark',
    [UserTypeEnum.All]: '',
  };
  childrenArrays: FormArray<FormGroup<ChildUserFormInterface>>[] = [];
  childChunks: { [userId: number]: { column: string; value: string }[][] } = {};

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.buildUsersForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.changeDisplayedUsers(changes);
  }

  /* ---------- inline edit ---------- */

  onInlineEdit(i: number): void {
    this.inlineEditIndexes.add(i);
  }

  onSaveInlineEdit(i: number): void {
    const group = this.usersArray.at(i);
    if (group.invalid) return;
    const updated = { ...this.displayedUsers[i], ...group.getRawValue() };
    this.userService.updateUser(updated);
    this.inlineEditIndexes.delete(i);
    group.markAsPristine();
    this.refreshRequested.emit();
  }

  onCancelInlineEdit(i: number): void {
    const group = this.usersArray.at(i);
    const original = this.displayedUsers[i];
    group.patchValue({
      name: original.name,
      age: original.age,
      email: original.email,
      phone: original.phone,
      address: original.address,
      registeredDate: original.registeredDate,
      role: original.role,
      isActive: original.isActive,
    });
    this.resetChildrenArray(
      group.get('children') as FormArray<FormGroup<ChildUserFormInterface>>,
      original.children ?? []
    );
    group.markAsPristine();
    this.inlineEditIndexes.delete(i);
  }

  /* ---------- cell editing ---------- */

  onCellDblClick(rowIndex: number, field: string): void {
    this.editingCell = { rowIndex, field };
    const control = this.usersArray.at(rowIndex).get(field);
    if (control) control.enable();
  }

  onCellBlur(rowIndex: number, field: string): void {
    if (!this.editingCell) return;
    const control = this.usersArray.at(rowIndex).get(field);
    if (control && control.valid) {
      const updatedUser = {
        ...this.displayedUsers[rowIndex],
        ...this.usersArray.at(rowIndex).getRawValue(),
      };
      this.userService.updateUser(updatedUser);
      this.refreshRequested.emit();
    } else if (control) {
      control.setValue(
        this.displayedUsers[rowIndex][field as keyof UserInterface]
      );
    }
    this.editingCell = null;
  }

  onCellKeydown(event: KeyboardEvent, rowIndex: number, field: string): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onCellBlur(rowIndex, field);
    } else if (event.key === 'Escape') {
      const control = this.usersArray.at(rowIndex).get(field);
      if (control)
        control.setValue(
          this.displayedUsers[rowIndex][field as keyof UserInterface]
        );
      this.editingCell = null;
    }
  }

  onStartAddColumn(user: UserInterface): void {
    this.addColumnUserId = user.id;
    this.addColumnForm = new FormGroup({
      column: new FormControl('', {
        nonNullable: true,
        validators: Validators.required,
      }),
      value: new FormControl('', {
        nonNullable: true,
        validators: Validators.required,
      }),
    });
  }

  onSaveColumn(user: UserInterface): void {
    if (this.addColumnForm.invalid) return;
    const child = this.addColumnForm.getRawValue();
    const userIndex = this.displayedUsers.findIndex((u) => u.id === user.id);
    if (userIndex === -1) return;
    const childrenArray = this.childrenArrays[userIndex];
    childrenArray.push(
      new FormGroup({
        column: new FormControl(child.column, {
          nonNullable: true,
          validators: Validators.required,
        }),
        value: new FormControl(child.value, {
          nonNullable: true,
          validators: Validators.required,
        }),
      })
    );
    const updatedUser = {
      ...this.displayedUsers[userIndex],
      ...this.usersArray.at(userIndex).getRawValue(),
    };
    this.userService.updateUser(updatedUser);
    this.addColumnUserId = null;
    this.refreshRequested.emit();
  }

  onCancelColumn(): void {
    this.addColumnUserId = null;
  }

  onAddColumn(i: number): void {
    this.childrenArrays[i].push(
      new FormGroup<ChildUserFormInterface>({
        column: new FormControl('', {
          nonNullable: true,
          validators: Validators.required,
        }),
        value: new FormControl('', {
          nonNullable: true,
          validators: Validators.required,
        }),
      })
    );
    this.usersArray.at(i).enable();

    const userId = this.displayedUsers[i].id;
    this.childChunks[userId] = this.chunkChildren(
      this.childrenArrays[i].value,
      8
    );
  }

  onRemoveColumn(i: number, j: number): void {
    this.childrenArrays[i].removeAt(j);
    const userId = this.displayedUsers[i].id;
    this.childChunks[userId] = this.chunkChildren(
      this.childrenArrays[i].value,
      8
    );
  }

  /* ---------- bulk mode ---------- */

  onSaveBulkMode(): void {
    if (this.usersForm.invalid) return;

    const updatedUsers: ({ id: number } & Partial<UserInterface>)[] = [];

    this.usersArray.controls.forEach((userGroup, index) => {
      const originalUser = this.displayedUsers[index];
      const changes: Partial<UserInterface> = {};

      Object.keys(userGroup.controls).forEach((key) => {
        const control = userGroup.get(key)!;

        if (key !== 'children' && control.dirty && control.valid) {
          const newValue = control.value;
          const oldValue = originalUser[key as keyof UserInterface];
          if (newValue !== oldValue) {
            changes[key as keyof UserInterface] = newValue;
          }
        }

        if (key === 'children') {
          const newChildren = control.value ?? [];
          const oldChildren = originalUser.children ?? [];

          if (JSON.stringify(newChildren) !== JSON.stringify(oldChildren)) {
            changes.children = newChildren;
          }
        }
      });

      if (Object.keys(changes).length > 0) {
        updatedUsers.push({ id: originalUser.id, ...changes });
      }
    });

    updatedUsers.forEach((partialUser) =>
      this.userService.updateUser(partialUser)
    );

    this.bulkModeChange.emit(false);
    this.refreshRequested.emit();
  }

  onCancelBulkMode(): void {
    this.bulkModeChange.emit(false);
    this.refreshRequested.emit();
  }

  /* ---------- row actions ---------- */

  onToggleStatus(user: UserInterface): void {
    this.userService.toggleStatus(user.id);
    this.refreshRequested.emit();
  }

  onEditUser(user: UserInterface): void {
    this.editUserRequest.emit(user.id);
  }

  onDeleteUser(user: UserInterface): void {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      this.userService.deleteUser(user.id);
      this.refreshRequested.emit();
    }
  }

  resetChildrenArray(
    array: FormArray<FormGroup<ChildUserFormInterface>>,
    original: { column: string; value: string }[]
  ): void {
    array.clear();
    original.forEach((c) => {
      array.push(
        new FormGroup<ChildUserFormInterface>({
          column: new FormControl(c.column, {
            nonNullable: true,
            validators: Validators.required,
          }),
          value: new FormControl(c.value, {
            nonNullable: true,
            validators: Validators.required,
          }),
        })
      );
    });
  }

  chunkChildren(
    children: Array<Partial<{ column: string; value: string }>>,
    size: number
  ): { column: string; value: string }[][] {
    const chunks: { column: string; value: string }[][] = [];
    for (let i = 0; i < children.length; i += size) {
      const safeSlice = children.slice(i, i + size).map((c) => ({
        column: c.column ?? '',
        value: c.value ?? '',
      }));
      chunks.push(safeSlice);
    }
    return chunks;
  }

  private buildUserGroup(user: UserInterface): FormGroup<UserFormInterface> {
    return new FormGroup<UserFormInterface>({
      id: new FormControl(user.id, { nonNullable: true }),
      name: new FormControl(user.name, {
        nonNullable: true,
        validators: Validators.required,
      }),
      age: new FormControl(user.age, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.min(18),
          Validators.max(120),
        ],
      }),
      email: new FormControl(user.email, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.email,
          uniqueEmailValidator(this.userService, user.email),
        ],
      }),
      phone: new FormControl(user.phone, {
        validators: [Validators.required],
        nonNullable: true,
      }),
      address: new FormControl(user.address, {
        validators: [Validators.required],
        nonNullable: true,
      }),
      registeredDate: new FormControl(user.registeredDate, {
        validators: [Validators.required],
        nonNullable: true,
      }),
      role: new FormControl(user.role, {
        nonNullable: true,
        validators: Validators.required,
      }),
      isActive: new FormControl(user.isActive, {
        nonNullable: true,
        validators: Validators.required,
      }),
      children: new FormArray(
        (user.children || []).map(
          (c) =>
            new FormGroup<ChildUserFormInterface>({
              column: new FormControl(c.column, {
                nonNullable: true,
                validators: Validators.required,
              }),
              value: new FormControl(c.value, {
                nonNullable: true,
                validators: Validators.required,
              }),
            })
        )
      ),
    });
  }

  private buildUsersForm(): void {
    const userGroups = this.displayedUsers.map((u) => this.buildUserGroup(u));
    this.usersForm = new FormGroup<UsersFormInterface>({
      users: new FormArray(userGroups),
    });

    this.childrenArrays = this.usersArray.controls.map(
      (group) =>
        group.get('children') as FormArray<FormGroup<ChildUserFormInterface>>
    );

    this.childChunks = {};
    this.displayedUsers.forEach((user) => {
      const children = user.children ?? [];
      this.childChunks[user.id] = this.chunkChildren(children, 8);
    });

    if (this.isBulkMode) {
      this.usersArray.controls.forEach((formGroup) => {
        const emailControl = formGroup.get('email');
        emailControl?.setValidators([Validators.required, Validators.email]);
        emailControl?.updateValueAndValidity();
      });
      this.usersForm.setValidators(
        bulkUniqueEmailValidator(this.userService, this.displayedUserEmails)
      );
      this.usersForm.updateValueAndValidity();
    }
  }

  private changeDisplayedUsers(changes: SimpleChanges) {
    if (changes['displayedUsers']) {
      this.buildUsersForm();
    }
    if (changes['isBulkMode'] && !changes['isBulkMode'].firstChange) {
      if (this.isBulkMode) {
        this.usersArray.controls.forEach((formGroup) => {
          const emailControl = formGroup.get('email');
          emailControl?.setValidators([Validators.required, Validators.email]);
          emailControl?.updateValueAndValidity();
        });
        this.usersForm.setValidators(
          bulkUniqueEmailValidator(this.userService, this.displayedUserEmails)
        );
        this.usersForm.updateValueAndValidity();
      } else {
        this.usersArray.controls.forEach((formGroup, idx) => {
          const original = this.displayedUsers[idx];
          const emailControl = formGroup.get('email');
          if (emailControl) {
            emailControl.setValidators([
              Validators.required,
              Validators.email,
              uniqueEmailValidator(this.userService, original.email),
            ]);
            emailControl.updateValueAndValidity();
          }
        });
        this.usersForm.clearValidators();
        this.usersForm.updateValueAndValidity();
      }
    }
  }

  get usersArray(): FormArray<FormGroup<UserFormInterface>> {
    return this.usersForm.get('users') as FormArray<
      FormGroup<UserFormInterface>
    >;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
