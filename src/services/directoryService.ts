import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import moment from 'moment';
import { FileInfo, DirectoryListingResponse, DirectoryMetadata } from '../types/directory';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const access = promisify(fs.access);

export class DirectoryService {
  private static readonly MAX_PATH_LENGTH = 4096;
  private static readonly RESTRICTED_PATHS = [
    '/etc/shadow',
    '/etc/passwd',
    'C:\\Windows\\System32\\config',
    'C:\\Windows\\System32\\drivers\\etc',
  ];

  /**
   * Validates if the given path is safe to access
   */
  private static async validatePath(dirPath: string): Promise<void> {
    if (!dirPath || dirPath.length > this.MAX_PATH_LENGTH) {
      throw createError('Invalid path length', 400);
    }

    // Normalize path and check for path traversal
    const normalizedPath = path.normalize(dirPath);
    if (normalizedPath.includes('..')) {
      throw createError('Path traversal not allowed', 403);
    }

    // Check against restricted paths
    const isRestricted = this.RESTRICTED_PATHS.some(restrictedPath => 
      normalizedPath.toLowerCase().includes(restrictedPath.toLowerCase())
    );
    
    if (isRestricted) {
      throw createError('Access to this path is restricted', 403);
    }

    // Check if path exists
    try {
      await access(normalizedPath, fs.constants.R_OK);
    } catch (error) {
      throw createError('Path does not exist or is not readable', 404);
    }
  }

  /**
   * Gets file permissions and attributes
   */
  private static async getFilePermissions(filePath: string, stats: fs.Stats): Promise<FileInfo['permissions']> {
    const mode = stats.mode;
    const isWindows = process.platform === 'win32';
    
    let permissions: FileInfo['permissions'] = {
      readable: false,
      writable: false,
      executable: false,
      owner: 'unknown',
      group: 'unknown',
      mode: mode.toString(8),
    };

    try {
      // Check read permission
      await access(filePath, fs.constants.R_OK);
      permissions.readable = true;
    } catch {}

    try {
      // Check write permission
      await access(filePath, fs.constants.W_OK);
      permissions.writable = true;
    } catch {}

    try {
      // Check execute permission
      await access(filePath, fs.constants.X_OK);
      permissions.executable = true;
    } catch {}

    // On Unix systems, extract owner and group info
    if (!isWindows && stats.uid !== undefined && stats.gid !== undefined) {
      try {
        const os = require('os');
        const userInfo = os.userInfo();
        permissions.owner = userInfo.username || stats.uid.toString();
        permissions.group = stats.gid.toString();
      } catch {
        permissions.owner = stats.uid.toString();
        permissions.group = stats.gid.toString();
      }
    }

    return permissions;
  }

  /**
   * Converts file stats to FileInfo object
   */
  private static async createFileInfo(filePath: string, fileName: string): Promise<FileInfo> {
    const stats = await stat(filePath);
    const permissions = await this.getFilePermissions(filePath, stats);
    const isDirectory = stats.isDirectory();
    const extension = isDirectory ? '' : path.extname(fileName).toLowerCase();
    
    return {
      name: fileName,
      path: filePath,
      size: isDirectory ? 0 : stats.size,
      extension,
      type: isDirectory ? 'directory' : 'file',
      createdDate: moment(stats.birthtime).toISOString(),
      modifiedDate: moment(stats.mtime).toISOString(),
      permissions,
      isHidden: fileName.startsWith('.') || (process.platform === 'win32' && fileName.startsWith('$')),
    };
  }

  /**
   * Lists directory contents with pagination and metadata
   */
  public static async listDirectory(
    dirPath: string,
    page: number = 1,
    limit: number = 100,
    includeHidden: boolean = false,
    sortBy: 'name' | 'size' | 'modified' | 'type' = 'name',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<DirectoryListingResponse> {
    await this.validatePath(dirPath);
    
    const normalizedPath = path.resolve(dirPath);
    logger.info(`Listing directory: ${normalizedPath}`, { page, limit, sortBy, sortOrder });

    // Check if path is a directory
    const pathStats = await stat(normalizedPath);
    if (!pathStats.isDirectory()) {
      throw createError('Path is not a directory', 400);
    }

    // Read directory contents
    const fileNames = await readdir(normalizedPath);
    
    // Create FileInfo objects for all items
    const allItems: FileInfo[] = [];
    const promises = fileNames.map(async (fileName) => {
      try {
        const filePath = path.join(normalizedPath, fileName);
        const fileInfo = await this.createFileInfo(filePath, fileName);
        
        // Filter hidden files if not requested
        if (!includeHidden && fileInfo.isHidden) {
          return null;
        }
        
        return fileInfo;
      } catch (error) {
        logger.warn(`Failed to get info for file: ${fileName}`, { error: (error as Error).message });
        return null;
      }
    });

    const results = await Promise.all(promises);
    allItems.push(...results.filter((item): item is FileInfo => item !== null));

    // Sort items
    allItems.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'modified':
          comparison = new Date(a.modifiedDate).getTime() - new Date(b.modifiedDate).getTime();
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Calculate pagination
    const total = allItems.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = allItems.slice(startIndex, endIndex);

    // Calculate metadata
    const totalFiles = allItems.filter(item => item.type === 'file').length;
    const totalDirectories = allItems.filter(item => item.type === 'directory').length;
    const totalSize = allItems
      .filter(item => item.type === 'file')
      .reduce((sum, item) => sum + item.size, 0);

    return {
      path: normalizedPath,
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
      metadata: {
        totalFiles,
        totalDirectories,
        totalSize,
        scannedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Gets metadata for a specific directory
   */
  public static async getDirectoryMetadata(dirPath: string): Promise<DirectoryMetadata> {
    const normalizedPath = path.resolve(dirPath);
    
    try {
      await this.validatePath(dirPath);
      
      const stats = await stat(normalizedPath);
      const permissions = await this.getFilePermissions(normalizedPath, stats);
      
      // Count items in directory
      let totalItems = 0;
      let totalSize = 0;
      
      if (stats.isDirectory()) {
        try {
          const items = await readdir(normalizedPath);
          totalItems = items.length;
          
          // Calculate total size (optional, can be expensive for large directories)
          const itemPromises = items.map(async (item) => {
            try {
              const itemPath = path.join(normalizedPath, item);
              const itemStats = await stat(itemPath);
              return itemStats.isFile() ? itemStats.size : 0;
            } catch {
              return 0;
            }
          });
          
          const sizes = await Promise.all(itemPromises);
          totalSize = sizes.reduce((sum, size) => sum + size, 0);
        } catch {
          // If we can't read the directory, leave counts at 0
        }
      }
      
      return {
        path: normalizedPath,
        exists: true,
        isDirectory: stats.isDirectory(),
        permissions: {
          readable: permissions.readable,
          writable: permissions.writable,
          executable: permissions.executable,
        },
        totalItems,
        totalSize,
        lastAccessed: moment(stats.atime).toISOString(),
        lastModified: moment(stats.mtime).toISOString(),
        created: moment(stats.birthtime).toISOString(),
      };
    } catch (error) {
      if ((error as any).statusCode === 404) {
        return {
          path: normalizedPath,
          exists: false,
          isDirectory: false,
          permissions: {
            readable: false,
            writable: false,
            executable: false,
          },
          totalItems: 0,
          totalSize: 0,
          lastAccessed: '',
          lastModified: '',
          created: '',
        };
      }
      throw error;
    }
  }
}