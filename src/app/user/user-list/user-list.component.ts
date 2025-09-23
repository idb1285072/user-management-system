import { Component, OnDestroy, OnInit } from '@angular/core';

import { UserService } from '../user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PaginationEvent } from 'src/app/shared/pagination/pagination.component';

import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  Subscription,
} from 'rxjs';
import { UserInterface } from '../types/user.interface';
import { UserTypeEnum } from '../types/enums/user-type.enum';
import { StatusTypeEnum } from '../types/enums/status-type.enum';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { uniqueEmailValidator } from 'src/app/shared/validators/unique-email.validator';
import { UsersFormInterface } from '../types/users-form.interface';
import { ChildUserFormInterface } from '../types/child-user-form.interface';
import { UserFormInterface } from '../types/user-form.interface';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
})
export class UserListComponent implements OnInit, OnDestroy {
  private searchSubject$ = new Subject<string>();
  private searchSubscription?: Subscription;
  displayedUsers: UserInterface[] = [];
  totalUsers: number = 0;
  isBulkUpdate: boolean = false;
  editingCell: { rowIndex: number; field: string } | null = null;
  addColumnForm!: FormGroup<ChildUserFormInterface>;
  usersForm!: FormGroup<UsersFormInterface>;

  inlineEditIndexes: Set<number> = new Set<number>();
  isBulkMode = false;
  addColumnUserId: number | null = null;

  currentPage: number = 1;
  itemsPerPage: number = 5;
  statusFilter: StatusTypeEnum = StatusTypeEnum.all;
  roleFilter: UserTypeEnum | 'all' = 'all';
  searchTerm: string = '';

  statusOptions = [
    { label: 'all', value: StatusTypeEnum.all },
    { label: 'active', value: StatusTypeEnum.active },
    { label: 'inactive', value: StatusTypeEnum.inactive },
  ];

  roleOptions: UserTypeEnum[] = Object.values(UserTypeEnum).filter(
    (v) => typeof v === 'number'
  ) as UserTypeEnum[];

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.buildUsersForm();
    this.initQueryParam();
    this.initSearchSubscription();
  }

  onCellDblClick(rowIndex: number, field: string) {
    this.editingCell = { rowIndex, field };
    const control = this.usersArray.at(rowIndex).get(field);
    if (control) control.enable();
  }

  onCellBlur(rowIndex: number, field: string) {
    if (!this.editingCell) return;
    const control = this.usersArray.at(rowIndex).get(field);
    if (control && control.valid) {
      const updatedUser = {
        ...this.displayedUsers[rowIndex],
        ...this.usersArray.at(rowIndex).getRawValue(),
      };
      this.userService.updateUser(updatedUser);
      this.refreshDisplayedUsers();
      const totalPages = Math.ceil(this.totalUsers / this.itemsPerPage);
      if (this.currentPage > totalPages) {
        this.currentPage = totalPages > 0 ? totalPages : 1;
        this.refreshDisplayedUsers();
        this.updateUrl();
      }
    } else if (control) {
      control.setValue(
        this.displayedUsers[rowIndex][field as keyof UserInterface]
      );
    }
    this.editingCell = null;
  }

  onCellKeydown(event: KeyboardEvent, rowIndex: number, field: string) {
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

  onInlineEdit(i: number) {
    this.inlineEditIndexes.add(i);
  }

  onCancelInlineEdit(i: number) {
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

  onSaveInlineEdit(i: number) {
    const group = this.usersArray.at(i);
    if (group.invalid) return;
    const updated = { ...this.displayedUsers[i], ...group.getRawValue() };
    this.userService.updateUser(updated);
    this.displayedUsers[i] = updated;
    group.markAsPristine();
    this.inlineEditIndexes.delete(i);
  }

  onEnableBulkMode() {
    this.isBulkMode = true;
    console.log(this.isBulkMode);
  }

  onCancelBulkMode() {
    this.isBulkMode = false;
    this.refreshDisplayedUsers();
  }

  onSaveBulkMode() {
    if (this.usersForm.invalid) return;
    const updatedUsers: UserInterface[] = [];
    this.usersArray.controls.forEach((userGroup, index) => {
      const originalUser = this.displayedUsers[index];
      const changes: Partial<UserInterface> = {};
      Object.keys(userGroup.controls).forEach((key) => {
        const control = userGroup.get(key)!;
        if (control.dirty && control.valid) {
          if (key === 'children') {
            const newChildren = control.value ?? [];
            if (
              JSON.stringify(newChildren) !==
              JSON.stringify(originalUser.children)
            ) {
              changes.children = newChildren;
            }
          } else {
            const newValue = control.value;
            const oldValue = originalUser[key as keyof UserInterface];
            if (newValue !== oldValue) {
              changes[key as keyof UserInterface] = newValue;
            }
          }
        }
      });
      if (Object.keys(changes).length > 0) {
        updatedUsers.push({ ...originalUser, ...changes });
      }
    });
    console.log(updatedUsers, 'updated');
    updatedUsers.forEach((user) => this.userService.updateUser(user));
    this.isBulkMode = false;
    this.refreshDisplayedUsers();
  }

  onStartAddColumn(user: UserInterface) {
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

  onAddColumn(i: number) {
    this.getChildren(i).push(
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
  }

  onRemoveColumn(i: number, j: number) {
    this.getChildren(i).removeAt(j);
  }

  onSaveColumn(user: UserInterface) {
    console.log(this.addColumnForm.hasError('required'));
    if (this.addColumnForm.invalid) return;
    const child = this.addColumnForm.getRawValue();
    const userIndex = this.displayedUsers.findIndex((u) => u.id === user.id);
    if (userIndex === -1) return;
    const childrenArray = this.getChildren(userIndex);
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
    this.refreshDisplayedUsers();
  }

  onCancelColumn() {
    this.addColumnUserId = null;
  }

  onRoleChange() {
    this.reload(true);
  }

  onStatusChange() {
    this.reload(true);
  }

  onSearchChange(searchTerm: string) {
    this.searchSubject$.next(searchTerm);
  }

  onToggleStatus(user: UserInterface) {
    this.userService.toggleStatus(user.id);
    this.refreshDisplayedUsers();
    const totalPages = Math.ceil(this.totalUsers / this.itemsPerPage);
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages > 0 ? totalPages : 1;
      this.refreshDisplayedUsers();
      this.updateUrl();
    }
  }

  onAddUser() {
    this.router.navigate(['/user-add']);
  }

  onEditUser(user: UserInterface) {
    this.router.navigate(['/user-edit', user.id]);
  }

  onDeleteUser(user: UserInterface) {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      this.userService.deleteUser(user.id);
      this.refreshDisplayedUsers();
      const totalPages = Math.ceil(this.totalUsers / this.itemsPerPage);
      if (this.currentPage > totalPages) {
        this.currentPage = totalPages > 0 ? totalPages : 1;
        this.refreshDisplayedUsers();
        this.updateUrl();
      }
    }
  }

  onPaginationChange(event: PaginationEvent) {
    this.itemsPerPage = event.itemsPerPage;
    this.currentPage = event.currentPage;
    this.refreshDisplayedUsers();
    this.updateUrl();
  }

  getChildren(i: number): FormArray<FormGroup<ChildUserFormInterface>> {
    return this.usersArray.at(i).get('children') as FormArray<
      FormGroup<ChildUserFormInterface>
    >;
  }

  getRoleName(role: UserTypeEnum) {
    return UserTypeEnum[role] || 'Unknown';
  }

  getRoleClass(role: UserTypeEnum) {
    const classes: Record<UserTypeEnum, string> = {
      [UserTypeEnum.SuperAdmin]: 'bg-dark',
      [UserTypeEnum.Admin]: 'bg-primary',
      [UserTypeEnum.Moderator]: 'bg-warning',
      [UserTypeEnum.Editor]: 'bg-info',
      [UserTypeEnum.Author]: 'bg-success',
      [UserTypeEnum.Contributor]: 'bg-secondary',
      [UserTypeEnum.User]: 'bg-light text-dark',
    };
    return classes[role] || '';
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

  private updateUrl() {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {
        page: this.currentPage,
        itemsPerPage: this.itemsPerPage,
        search: this.searchTerm || null,
        status: this.statusFilter,
        role: this.roleFilter !== 'all' ? this.roleFilter : null,
      },
      queryParamsHandling: 'merge',
    });
  }

  private refreshDisplayedUsers() {
    const { users, totalUsers } = this.userService.getPaginatedUsers(
      this.currentPage,
      this.itemsPerPage,
      this.statusFilter,
      this.searchTerm,
      this.roleFilter
    );
    this.displayedUsers = users;
    this.totalUsers = totalUsers;
    this.buildUsersForm();
  }

  private reload(resetPage: boolean = false) {
    if (resetPage) this.currentPage = 1;
    this.refreshDisplayedUsers();
    this.updateUrl();
  }

  private initQueryParam() {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.currentPage = +params['page'] || 1;
      this.itemsPerPage = +params['itemsPerPage'] || 5;
      this.searchTerm = params['search'] || '';
      const statusParam = params['status'];
      if (statusParam && !isNaN(+statusParam)) {
        this.statusFilter = +statusParam as StatusTypeEnum;
      } else {
        this.statusFilter = StatusTypeEnum.active;
      }
      if (params['role'] && params['role'] !== 'all') {
        this.roleFilter = +params['role'];
      } else {
        this.roleFilter = 'all';
      }
      this.refreshDisplayedUsers();
    });
  }

  private initSearchSubscription() {
    this.searchSubscription = this.searchSubject$
      .pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe((text) => {
        this.searchTerm = text;
        this.reload(true);
      });
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
  }

  private resetChildrenArray(
    array: FormArray<FormGroup<ChildUserFormInterface>>,
    original: { column: string; value: string }[]
  ) {
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

  get usersArray(): FormArray<FormGroup<UserFormInterface>> {
    return this.usersForm.get('users') as FormArray<
      FormGroup<UserFormInterface>
    >;
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }
}
