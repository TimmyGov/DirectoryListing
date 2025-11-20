export interface FileInfo {
  name: string;
  path: string;
  size: number;
  extension: string;
  type: 'file' | 'directory';
  createdDate: string;
  modifiedDate: string;
  permissions: {
    readable: boolean;
    writable: boolean;
    executable: boolean;
    owner: string;
    group: string;
    mode: string;
  };
  isHidden: boolean;
}

export interface DirectoryListingResponse {
  path: string;
  items: FileInfo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  metadata: {
    totalFiles: number;
    totalDirectories: number;
    totalSize: number;
    scannedAt: string;
  };
}

export interface DirectoryMetadata {
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