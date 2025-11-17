import express from 'express';
import {
  getEntriesForWeek,
  getEntryById,
  createEntry,
  updateEntry,
  deleteEntry,
  getDeletedEntries
} from '../controllers/entryController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get entries for a specific week
router.get('/week/:year/:week', getEntriesForWeek);

// Get deleted entries (teachers, principals, admins only)
router.get('/deleted', authorize('TEACHER', 'PRINCIPAL', 'ADMIN'), getDeletedEntries);

// Get single entry
router.get('/:id', getEntryById);

// Create entry
router.post('/', createEntry);

// Update entry
router.put('/:id', updateEntry);

// Delete entry (soft delete for most users, hard delete for admins)
router.delete('/:id', deleteEntry);

export default router;
