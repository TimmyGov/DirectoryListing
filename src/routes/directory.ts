import { Router } from 'express';
import {
  listDirectory,
  getDirectoryMetadata,
  getApiInfo,
  validateDirectoryListing,
  validateDirectoryMetadata,
} from '../controllers/directoryController';

const router = Router();

/**
 * @route GET /api/v1/directory
 * @desc Get API information
 * @access Public
 */
router.get('/', getApiInfo);

/**
 * @route GET /api/v1/directory/list
 * @desc List directory contents with pagination
 * @param {string} path - Directory path to list
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [limit=100] - Items per page (max 1000)
 * @param {boolean} [includeHidden=false] - Include hidden files
 * @param {string} [sortBy=name] - Sort by: name, size, modified, type
 * @param {string} [sortOrder=asc] - Sort order: asc, desc
 * @access Public
 */
router.get('/list', validateDirectoryListing, listDirectory);

/**
 * @route GET /api/v1/directory/metadata
 * @desc Get directory metadata
 * @param {string} path - Directory path
 * @access Public
 */
router.get('/metadata', validateDirectoryMetadata, getDirectoryMetadata);

export default router;