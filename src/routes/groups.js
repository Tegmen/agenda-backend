import express from 'express';
import {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  getGroupMembers
} from '../controllers/groupController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all groups (filtered by user role)
router.get('/', getAllGroups);

// Get single group
router.get('/:id', getGroupById);

// Get group members
router.get('/:id/members', getGroupMembers);

// Create group (principals and admins only)
router.post('/', authorize('PRINCIPAL', 'ADMIN'), createGroup);

// Update group (principals and admins only)
router.put('/:id', authorize('PRINCIPAL', 'ADMIN'), updateGroup);

// Delete group (principals and admins only)
router.delete('/:id', authorize('PRINCIPAL', 'ADMIN'), deleteGroup);

// Add member to group (principals and admins only)
router.post('/:id/members', authorize('PRINCIPAL', 'ADMIN'), addMember);

// Remove member from group (principals and admins only)
router.delete('/:id/members/:userId', authorize('PRINCIPAL', 'ADMIN'), removeMember);

export default router;
