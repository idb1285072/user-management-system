import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { StatusTypeEnum } from '../../types/enums/status-type.enum';
import { UserTypeEnum } from '../../types/enums/user-type.enum';
import { FormControl, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { FilterFormInterface } from '../../types/filter-form.interface';

@Component({
  selector: 'app-user-filters',
  templateUrl: './user-filters.component.html',
  styleUrls: ['./user-filters.component.css'],
})
export class UserFiltersComponent implements OnInit, OnChanges {
  @Input() isBulkMode = false;
  @Input() statusFilter: StatusTypeEnum = StatusTypeEnum.inactive;
  @Input() roleFilter: UserTypeEnum = UserTypeEnum.All;
  @Input() statusOptions!: Array<{ label: string; value: StatusTypeEnum }>;
  @Input() roleOptions!: UserTypeEnum[];
  @Input() searchTerm = '';

  @Output() statusChange = new EventEmitter<StatusTypeEnum>();
  @Output() roleChange = new EventEmitter<UserTypeEnum>();
  @Output() search = new EventEmitter<string>();
  @Output() enableBulk = new EventEmitter<void>();
  @Output() addUser = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  filterForm: FormGroup<FilterFormInterface> = new FormGroup({
    status: new FormControl<StatusTypeEnum>(this.statusFilter, {
      nonNullable: true,
    }),
    role: new FormControl<UserTypeEnum>(this.roleFilter, { nonNullable: true }),
    search: new FormControl<string>(this.searchTerm, { nonNullable: true }),
  });

  UserTypeEnum = UserTypeEnum;

  ngOnInit(): void {
    this.initSearchParam();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.changeSearchParam(changes);
  }

  onStatusChangeLocal(value: StatusTypeEnum): void {
    this.statusChange.emit(value);
  }

  onRoleChangeLocal(value: UserTypeEnum): void {
    this.roleChange.emit(value);
  }

  onEnableBulkClicked(): void {
    this.enableBulk.emit();
  }

  onAddUserClicked(): void {
    this.addUser.emit();
  }

  private initSearchParam(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((filters) => {
        this.statusChange.emit(filters.status);
        this.roleChange.emit(filters.role);
        this.search.emit(filters.search || '');
      });
  }

  private changeSearchParam(changes: SimpleChanges): void {
    if (this.filterForm) {
      this.filterForm.patchValue(
        {
          status: this.statusFilter,
          role: this.roleFilter,
          search: this.searchTerm,
        },
        { emitEvent: false }
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
