import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  DirectoryListingResponse, 
  DirectoryMetadataResponse, 
  ApiResponse,
  DirectoryListingParams 
} from '../models/file-info.model';

@Injectable({
  providedIn: 'root'
})
export class DirectoryService {
  private readonly apiUrl = 'http://localhost:3000/api/v1/directory';
  
  // Current path state
  private currentPathSubject = new BehaviorSubject<string>('/');
  public currentPath$ = this.currentPathSubject.asObservable();
  
  // Loading state
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Get directory listing with pagination and sorting
   */
  getDirectoryListing(params: DirectoryListingParams): Observable<DirectoryListingResponse> {
    this.loadingSubject.next(true);
    
    let httpParams = new HttpParams()
      .set('path', params.path)
      .set('page', (params.page || 1).toString())
      .set('limit', (params.limit || 100).toString())
      .set('includeHidden', (params.includeHidden || false).toString())
      .set('sortBy', params.sortBy || 'name')
      .set('sortOrder', params.sortOrder || 'asc');

    return this.http.get<ApiResponse<DirectoryListingResponse>>(`${this.apiUrl}/list`, { params: httpParams })
      .pipe(
        map(response => {
          this.loadingSubject.next(false);
          this.currentPathSubject.next(params.path);
          return response.data;
        }),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Get directory metadata
   */
  getDirectoryMetadata(path: string): Observable<DirectoryMetadataResponse> {
    const params = new HttpParams().set('path', path);
    
    return this.http.get<ApiResponse<DirectoryMetadataResponse>>(`${this.apiUrl}/metadata`, { params })
      .pipe(
        map(response => response.data),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Get API information
   */
  getApiInfo(): Observable<any> {
    return this.http.get<any>(this.apiUrl)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Navigate to a specific directory path
   */
  navigateToPath(path: string): Observable<DirectoryListingResponse> {
    return this.getDirectoryListing({ path });
  }

  /**
   * Go up one directory level
   */
  navigateUp(): Observable<DirectoryListingResponse> {
    const currentPath = this.currentPathSubject.value;
    const parentPath = this.getParentPath(currentPath);
    return this.navigateToPath(parentPath);
  }

  /**
   * Get parent directory path
   */
  private getParentPath(path: string): string {
    if (path === '/' || path === '') return '/';
    
    // Handle Windows paths
    if (path.match(/^[A-Z]:\\?$/)) return path;
    
    const separator = path.includes('\\') ? '\\' : '/';
    const parts = path.split(separator).filter(part => part !== '');
    
    if (parts.length <= 1) {
      return path.includes('\\') ? 'C:\\' : '/';
    }
    
    parts.pop();
    
    if (path.includes('\\')) {
      return parts.join('\\') + '\\';
    } else {
      return '/' + parts.join('/');
    }
  }

  /**
   * Get current path
   */
  getCurrentPath(): string {
    return this.currentPathSubject.value;
  }

  /**
   * Set current path
   */
  setCurrentPath(path: string): void {
    this.currentPathSubject.next(path);
  }

  /**
   * Create breadcrumb items from path
   */
  getBreadcrumbs(path: string): Array<{ name: string; path: string }> {
    const breadcrumbs: Array<{ name: string; path: string }> = [];
    
    if (!path || path === '/') {
      breadcrumbs.push({ name: 'Root', path: '/' });
      return breadcrumbs;
    }
    
    // Handle Windows paths
    if (path.includes('\\')) {
      const parts = path.split('\\').filter(part => part !== '');
      let currentPath = '';
      
      parts.forEach((part, index) => {
        if (index === 0) {
          // Drive letter
          currentPath = part + '\\';
          breadcrumbs.push({ name: part, path: currentPath });
        } else {
          currentPath += part + '\\';
          breadcrumbs.push({ name: part, path: currentPath });
        }
      });
    } else {
      // Unix paths
      breadcrumbs.push({ name: 'Root', path: '/' });
      const parts = path.split('/').filter(part => part !== '');
      let currentPath = '';
      
      parts.forEach(part => {
        currentPath += '/' + part;
        breadcrumbs.push({ name: part, path: currentPath });
      });
    }
    
    return breadcrumbs;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file icon based on extension (Bootstrap Icons)
   */
  getFileIcon(fileInfo: any): string {
    if (fileInfo.type === 'directory') {
      return 'bi-folder-fill';
    }
    
    const extension = fileInfo.extension?.toLowerCase();
    
    switch (extension) {
      case '.pdf': return 'bi-file-earmark-pdf';
      case '.doc': case '.docx': return 'bi-file-earmark-word';
      case '.xls': case '.xlsx': return 'bi-file-earmark-excel';
      case '.ppt': case '.pptx': return 'bi-file-earmark-ppt';
      case '.jpg': case '.jpeg': case '.png': case '.gif': case '.bmp': case '.svg': return 'bi-file-earmark-image';
      case '.mp4': case '.avi': case '.mkv': case '.mov': case '.webm': return 'bi-file-earmark-play';
      case '.mp3': case '.wav': case '.flac': case '.ogg': return 'bi-file-earmark-music';
      case '.zip': case '.rar': case '.7z': case '.tar': case '.gz': return 'bi-file-earmark-zip';
      case '.js': case '.ts': case '.html': case '.css': case '.json': case '.xml': case '.yaml': case '.yml': return 'bi-file-earmark-code';
      case '.txt': case '.log': case '.md': case '.readme': return 'bi-file-earmark-text';
      case '.exe': case '.msi': case '.deb': case '.rpm': return 'bi-file-earmark-binary';
      case '.iso': case '.dmg': return 'bi-disc';
      case '.sql': case '.db': case '.sqlite': return 'bi-database';
      default: return 'bi-file-earmark';
    }
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    this.loadingSubject.next(false);
    
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server Error: ${error.status} - ${error.message}`;
      
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }
    
    console.error('DirectoryService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}