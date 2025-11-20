import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { DirectoryService } from '../../services/directory.service';
import { NotificationService } from '../../services/notification.service';
import { DirectoryListingResponse, FileInfo, DirectoryListingParams } from '../../models/file-info.model';
import { Breadcrumb } from '../breadcrumb/breadcrumb';
import { FileList } from '../file-list/file-list';

@Component({
  selector: 'app-directory-browser',
  imports: [
    CommonModule,
    FormsModule,
    Breadcrumb,
    FileList
  ],
  templateUrl: './directory-browser.html',
  styleUrl: './directory-browser.scss',
})
export class DirectoryBrowser implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data properties
  directoryData: DirectoryListingResponse | null = null;
  currentPath: string = '/';
  breadcrumbs: Array<{ name: string; path: string }> = [];
  loading: boolean = false;
  lastUpdate: string = '';

  // Filter and sort options
  currentPage: number = 1;
  itemsPerPage: number = 100;
  includeHidden: boolean = false;
  sortBy: 'name' | 'size' | 'modified' | 'type' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  // UI state
  sidenavOpened: boolean = true;
  customPath: string = '';

  constructor(
    public directoryService: DirectoryService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    console.log('DirectoryBrowser constructor called');
    console.log('NgZone is stable:', this.ngZone.isStable);
  }

  ngOnInit(): void {
    console.log('DirectoryBrowser ngOnInit called');
    this.initializeDefaultPath();
    this.subscribeToDirectoryService();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeDefaultPath(): void {
    // Set default path based on platform
    console.log('Initializing default path');
    const isWindows = navigator.userAgent.indexOf('Windows') !== -1;
    this.currentPath = isWindows ? 'C:\\' : '/';
    this.customPath = this.currentPath;
    console.log('Default path set to:', this.currentPath);
    this.loadDirectory();
  }

  private subscribeToDirectoryService(): void {
    // Subscribe to loading state
    this.directoryService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);

    // Subscribe to current path changes
    this.directoryService.currentPath$
      .pipe(takeUntil(this.destroy$))
      .subscribe(path => {
        this.currentPath = path;
        this.customPath = path;
        this.updateBreadcrumbs();
      });
  }

  private updateBreadcrumbs(): void {
    this.breadcrumbs = this.directoryService.getBreadcrumbs(this.currentPath);
  }

  loadDirectory(params?: Partial<DirectoryListingParams>): void {
    console.log('loadDirectory called with params:', params);
    console.log('Current path:', this.currentPath);
    
    const requestParams: DirectoryListingParams = {
      path: this.currentPath,
      page: this.currentPage,
      limit: this.itemsPerPage,
      includeHidden: this.includeHidden,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      ...params
    };

    console.log('Request params:', requestParams);
    console.log('About to call directoryService.getDirectoryListing...');

    this.loading = true;
    this.directoryService.getDirectoryListing(requestParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('SUCCESS: Directory data received:', data);
          console.log('Items count:', data?.items?.length);
          console.log('Data structure:', JSON.stringify(data, null, 2));
          console.log('NgZone is stable before update:', this.ngZone.isStable);
          
          // Use NgZone.run to ensure change detection
          this.ngZone.run(() => {
            this.directoryData = data;
            this.loading = false;
            this.lastUpdate = new Date().toLocaleTimeString();
            console.log('Component directoryData updated:', this.directoryData);
            console.log('NgZone is stable after update:', this.ngZone.isStable);
            // Force change detection to update UI
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Directory loading error:', error);
          this.ngZone.run(() => {
            this.loading = false;
            this.cdr.detectChanges();
          });
          this.showError(`Failed to load directory: ${error.message}`);
        }
      });
  }

  onItemSelected(item: FileInfo): void {
    if (item.type === 'directory') {
      this.navigateToPath(item.path);
    } else {
      this.showInfo(`Selected file: ${item.name} (${this.directoryService.formatFileSize(item.size)})`);
    }
  }

  navigateToPath(path: string): void {
    this.currentPath = path;
    this.currentPage = 1; // Reset to first page when changing directories
    this.loadDirectory();
  }

  onBreadcrumbSelected(path: string): void {
    this.navigateToPath(path);
  }

  onNavigateUp(): void {
    console.log('onNavigateUp called');
    console.log('Current path before navigate up:', this.currentPath);
    
    this.loading = true;
    this.directoryService.navigateUp()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('SUCCESS: Navigate up data received:', data);
          console.log('NgZone is stable before update:', this.ngZone.isStable);
          
          // Use NgZone.run to ensure change detection
          this.ngZone.run(() => {
            this.directoryData = data;
            this.currentPage = 1;
            this.loading = false;
            this.lastUpdate = new Date().toLocaleTimeString();
            console.log('Navigate up - directoryData updated:', this.directoryData);
            console.log('NgZone is stable after update:', this.ngZone.isStable);
            // Force change detection to update UI
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Navigate up error:', error);
          this.ngZone.run(() => {
            this.loading = false;
            this.cdr.detectChanges();
          });
          this.showError(`Failed to navigate up: ${error.message}`);
        }
      });
  }

  onSortChanged(sort: { sortBy: string; sortOrder: string }): void {
    this.sortBy = sort.sortBy as any;
    this.sortOrder = sort.sortOrder as any;
    this.currentPage = 1; // Reset to first page when changing sort
    this.loadDirectory();
  }

  onPageChanged(page: number): void {
    this.currentPage = page;
    this.loadDirectory();
  }

  onLimitChanged(limit: number): void {
    this.itemsPerPage = limit;
    this.currentPage = 1; // Reset to first page when changing limit
    this.loadDirectory();
  }

  onFiltersChanged(): void {
    this.currentPage = 1; // Reset to first page when changing filters
    this.loadDirectory();
  }

  onCustomPathSubmit(): void {
    if (this.customPath && this.customPath !== this.currentPath) {
      this.navigateToPath(this.customPath);
    }
  }

  refreshDirectory(): void {
    this.loadDirectory();
  }

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }

  private showError(message: string): void {
    this.notificationService.showError(message);
  }

  private showInfo(message: string): void {
    this.notificationService.showInfo(message);
  }

  // Quick navigation methods
  navigateToHome(): void {
    const isWindows = navigator.userAgent.indexOf('Windows') !== -1;
    const homePath = isWindows ? 'C:\\Users' : '/home';
    this.navigateToPath(homePath);
  }

  navigateToRoot(): void {
    const isWindows = navigator.userAgent.indexOf('Windows') !== -1;
    const rootPath = isWindows ? 'C:\\' : '/';
    this.navigateToPath(rootPath);
  }

  navigateToDocuments(): void {
    const isWindows = navigator.userAgent.indexOf('Windows') !== -1;
    const docsPath = isWindows ? 'C:\\Users\\' : '/home/';
    this.navigateToPath(docsPath);
  }

  getDirectoryName(): string {
    if (!this.currentPath) return '';
    const parts = this.currentPath.split(/[\/\\]/).filter(p => p);
    return parts[parts.length - 1] || 'Root';
  }
}