export interface FilePermissions {
  readable: boolean;
  writable: boolean;
  executable: boolean;
  owner?: string;
  group?: string;
  mode?: string;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  extension: string;
  type: 'file' | 'directory';
  createdDate: string;
  modifiedDate: string;
  permissions: FilePermissions;
  isHidden: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface DirectoryMetadata {
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
  scannedAt: string;
}

export interface DirectoryListingResponse {
  path: string;
  items: FileInfo[];
  pagination: Pagination;
  metadata: DirectoryMetadata;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface DirectoryMetadataResponse {
  path: string;
  exists: boolean;
  isDirectory: boolean;
  permissions: {
    readable: boolean;
    writable: boolean;
    executable: boolean;
  };
  totalItems: number;
  totalSize: number;
  lastAccessed: string;
  lastModified: string;
  created: string;
}

export interface SortOptions {
  sortBy: 'name' | 'size' | 'modified' | 'type';
  sortOrder: 'asc' | 'desc';
}

export interface DirectoryListingParams {
  path: string;
  page?: number;
  limit?: number;
  includeHidden?: boolean;
  sortBy?: 'name' | 'size' | 'modified' | 'type';
  sortOrder?: 'asc' | 'desc';
}