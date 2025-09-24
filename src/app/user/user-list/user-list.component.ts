import { Component, OnDestroy, OnInit } from '@angular/core';

import { UserService } from '../user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PaginationEvent } from 'src/app/shared/pagination/pagination.component';

import { Subject, takeUntil } from 'rxjs';
import { UserInterface } from '../types/user.interface';
import { UserTypeEnum } from '../types/enums/user-type.enum';
import { StatusTypeEnum } from '../types/enums/status-type.enum';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
})
export class UserListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  displayedUsers: UserInterface[] = [];
  totalUsers = 0;

  currentPage = 1;
  itemsPerPage = 5;
  statusFilter: StatusTypeEnum = StatusTypeEnum.active;
  roleFilter: UserTypeEnum | 'all' = 'all';
  searchTerm = '';

  isBulkMode = false;
  roleOptions: UserTypeEnum[] = Object.values(UserTypeEnum).filter(
    (v) => typeof v === 'number'
  ) as UserTypeEnum[];

  statusOptions = [
    { label: 'all', value: StatusTypeEnum.all },
    { label: 'active', value: StatusTypeEnum.active },
    { label: 'inactive', value: StatusTypeEnum.inactive },
  ];

  constructor(
    private userService: UserService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initQueryParamHandling();
  }

  onChildRefreshRequested() {
    this.refreshDisplayedUsers();
    const totalPages = Math.ceil(this.totalUsers / this.itemsPerPage);
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages > 0 ? totalPages : 1;
      this.refreshDisplayedUsers();
      this.updateUrl();
    }
  }

  onChildBulkModeChange(state: boolean) {
    this.isBulkMode = state;
  }

  onSearch(term: string) {
    this.searchTerm = term || '';
    this.currentPage = 1;
    this.updateUrl();
  }

  onStatusChange(status: StatusTypeEnum) {
    this.statusFilter = status;
    this.currentPage = 1;
    this.updateUrl();
  }

  onRoleChange(role: UserTypeEnum | 'all') {
    this.roleFilter = role;
    this.currentPage = 1;
    this.updateUrl();
  }

  onEnableBulkMode() {
    this.isBulkMode = true;
  }

  onAddUser() {
    this.router.navigate(['/user-add']);
  }

  onEditUser(id: number) {
    this.router.navigate(['/user-edit', id]);
  }

  onPaginationChange(event: PaginationEvent) {
    this.itemsPerPage = event.itemsPerPage;
    this.currentPage = event.currentPage;
    this.updateUrl();
  }

  private updateUrl() {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {
        page: this.currentPage,
        itemsPerPage: this.itemsPerPage,
        search: this.searchTerm || null,
        status: this.statusFilter,
        role: this.roleFilter !== 'all' ? this.roleFilter : 'all',
      },
      queryParamsHandling: 'merge',
    });
  }

  private initQueryParamHandling() {
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.currentPage = +params['page'] || 1;
        this.itemsPerPage = +params['itemsPerPage'] || 5;

        const searchValue = params['search'] ?? '';
        this.searchTerm = searchValue;

        const statusParam = params['status'];
        if (statusParam && !isNaN(+statusParam)) {
          this.statusFilter = +statusParam as StatusTypeEnum;
        } else {
          this.statusFilter = StatusTypeEnum.active;
        }

        const roleParam = params['role'];
        if (roleParam && roleParam !== 'all') {
          this.roleFilter = +roleParam as UserTypeEnum;
        } else {
          this.roleFilter = 'all';
        }
        this.refreshDisplayedUsers();
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
  }

  get displayedUserEmails(): string[] {
    return this.displayedUsers.map((u) => u.email);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
