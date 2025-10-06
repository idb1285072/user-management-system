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
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-user-filters',
  templateUrl: './user-filters.component.html',
  styleUrls: ['./user-filters.component.css'],
})
export class UserFiltersComponent implements OnInit, OnChanges {
  @Input() isBulkMode = false;
  @Input() statusFilter!: StatusTypeEnum;
  @Input() roleFilter!: UserTypeEnum;
  @Input() statusOptions!: Array<{ label: string; value: StatusTypeEnum }>;
  @Input() roleOptions!: UserTypeEnum[];
  @Input() searchTerm = '';

  @Output() statusChange = new EventEmitter<StatusTypeEnum>();
  @Output() roleChange = new EventEmitter<UserTypeEnum>();
  @Output() search = new EventEmitter<string>();
  @Output() enableBulk = new EventEmitter<void>();
  @Output() addUser = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  searchControl = new FormControl<string>('', { nonNullable: true });

  ngOnInit(): void {
    this.initSearchParam();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.changeSearchParam(changes);
  }

  onStatusChangeLocal(value: StatusTypeEnum) {
    this.statusChange.emit(value);
  }

  onRoleChangeLocal(value: UserTypeEnum) {
    this.roleChange.emit(value);
  }

  onEnableBulkClicked() {
    this.enableBulk.emit();
  }

  onAddUserClicked() {
    this.addUser.emit();
  }

  getRoleName(role: UserTypeEnum) {
    return UserTypeEnum[role] || 'Unknown';
  }

  private initSearchParam() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((v) => this.search.emit(v || ''));
  }

  private changeSearchParam(changes: SimpleChanges) {
    if (
      changes['searchTerm'] &&
      changes['searchTerm'].currentValue !== this.searchControl.value
    ) {
      this.searchControl.setValue(this.searchTerm, { emitEvent: false });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
