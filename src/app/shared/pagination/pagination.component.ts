import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PageSizeEnum } from 'src/app/shared/types/enums/page-size.enum';

export interface PaginationEvent {
  currentPage: number;
  itemsPerPage: number;
}

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css'],
})
export class PaginationComponent {
  @Input() totalItems: number = 0;
  @Input() itemsPerPage: number = 5;
  @Input() currentPage: number = 1;
  @Input() isDisabled: boolean = false;
  
  @Output() pageChange = new EventEmitter<PaginationEvent>();

  pageSizes: number[] = Object.values(PageSizeEnum).filter(
    (value) => typeof value === 'number'
  ) as number[];

  onChangePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.emitChange();
  }

  onChangePageSize(size: number) {
    this.itemsPerPage = size;
    this.currentPage = 1;
    this.emitChange();
  }

  private emitChange() {
    this.pageChange.emit({
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
    });
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage) || 1;
  }
}
