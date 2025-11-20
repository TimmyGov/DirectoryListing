import { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { DirectoryService } from '../services/directoryService';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

/**
 * Validation rules for directory listing
 */
export const validateDirectoryListing = [
  query('path')
    .notEmpty()
    .withMessage('Path is required')
    .isLength({ max: 4096 })
    .withMessage('Path too long'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000')
    .toInt(),
  query('includeHidden')
    .optional()
    .isBoolean()
    .withMessage('includeHidden must be a boolean')
    .toBoolean(),
  query('sortBy')
    .optional()
    .isIn(['name', 'size', 'modified', 'type'])
    .withMessage('sortBy must be one of: name, size, modified, type'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be asc or desc'),
];

/**
 * Validation rules for directory metadata
 */
export const validateDirectoryMetadata = [
  query('path')
    .notEmpty()
    .withMessage('Path is required')
    .isLength({ max: 4096 })
    .withMessage('Path too long'),
];

/**
 * Controller for listing directory contents
 */
export const listDirectory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
    return;
  }

  const {
    path: dirPath,
    page = 1,
    limit = 100,
    includeHidden = false,
    sortBy = 'name',
    sortOrder = 'asc',
  } = req.query as any;

  logger.info('Directory listing request', {
    path: dirPath,
    page,
    limit,
    includeHidden,
    sortBy,
    sortOrder,
    ip: req.ip,
  });

  const result = await DirectoryService.listDirectory(
    dirPath,
    page,
    limit,
    includeHidden,
    sortBy,
    sortOrder
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Controller for getting directory metadata
 */
export const getDirectoryMetadata = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
    return;
  }

  const { path: dirPath } = req.query as any;

  logger.info('Directory metadata request', {
    path: dirPath,
    ip: req.ip,
  });

  const metadata = await DirectoryService.getDirectoryMetadata(dirPath);

  res.status(200).json({
    success: true,
    data: metadata,
  });
});

/**
 * Controller for getting API information
 */
export const getApiInfo = (req: Request, res: Response): void => {
  res.status(200).json({
    name: 'Directory Listing API',
    version: '1.0.0',
    description: 'REST API for file system directory listing with metadata and permissions',
    endpoints: {
      'GET /': 'API information',
      'GET /list': 'List directory contents with pagination',
      'GET /metadata': 'Get directory metadata',
    },
    features: [
      'Full directory listing with file metadata',
      'File permissions and attributes',
      'Pagination for large directories',
      'Sorting and filtering',
      'Security protection against path traversal',
      'Cross-platform compatibility',
    ],
  });
};