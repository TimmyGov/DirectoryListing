import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileInfo, DirectoryListingResponse } from '../../models/file-info.model';
import { DirectoryService } from '../../services/directory.service';
import moment from 'moment';

@Component({
  selector: 'app-file-list',
  imports: [
    CommonModule
  ],
  templateUrl: './file-list.html',
  styleUrl: './file-list.scss',
})
export class FileList implements OnChanges {
  @Input() directoryData: DirectoryListingResponse | null = null;
  @Input() loading: boolean = false;
  @Output() itemSelected = new EventEmitter<FileInfo>();
  @Output() sortChanged = new EventEmitter<{sortBy: string, sortOrder: string}>();
  @Output() limitChanged = new EventEmitter<number>();
  @Output() pageChanged = new EventEmitter<number>();

  currentSort = { column: 'name', direction: 'asc' };
  pageSizeOptions = [25, 50, 100, 200, 500];

  constructor(public directoryService: DirectoryService, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    console.log('FileList ngOnChanges called:', changes);
    if (changes['directoryData']) {
      console.log('Directory data changed:', {
        previous: changes['directoryData'].previousValue,
        current: changes['directoryData'].currentValue
      });
      // Force change detection
      this.cdr.detectChanges();
    }
    if (changes['loading']) {
      console.log('Loading state changed:', changes['loading'].currentValue);
      this.cdr.detectChanges();
    }
  }

  onItemClick(item: FileInfo): void {
    this.itemSelected.emit(item);
  }

  onSortChange(sortBy: string): void {
    if (this.currentSort.column === sortBy) {
      this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSort.column = sortBy;
      this.currentSort.direction = 'asc';
    }
    this.sortChanged.emit({ sortBy, sortOrder: this.currentSort.direction });
  }

  onPageChange(page: number): void {
    this.pageChanged.emit(page);
  }

  onPageSizeChange(size: number): void {
    this.limitChanged.emit(size);
  }

  getFileIcon(file: FileInfo): string {
    return this.directoryService.getFileIcon(file);
  }

  formatFileSize(bytes: number): string {
    return this.directoryService.formatFileSize(bytes);
  }

  formatDate(dateString: string): string {
    return moment(dateString).format('MMM DD, YYYY HH:mm');
  }

  formatPermissions(permissions: any): string {
    let result = '';
    result += permissions.readable ? 'r' : '-';
    result += permissions.writable ? 'w' : '-';
    result += permissions.executable ? 'x' : '-';
    return result;
  }

  isDirectory(item: FileInfo): boolean {
    return item.type === 'directory';
  }

  getRowClass(item: FileInfo): string {
    let classes = '';
    if (item.isHidden) classes += 'hidden-file ';
    if (this.isDirectory(item)) classes += 'directory-row ';
    return classes.trim();
  }

  trackByFn(index: number, item: FileInfo): string {
    return item.path + item.name;
  }

  getTotalPages(): number {
    if (!this.directoryData?.pagination) return 1;
    return Math.ceil(this.directoryData.pagination.total / this.directoryData.pagination.limit);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const currentPage = this.directoryData?.pagination.page || 1;
    const pages: number[] = [];
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  Math = Math; // Make Math available in template
}
