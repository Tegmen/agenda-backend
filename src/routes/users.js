import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all users (principals and admins only)
router.get('/', authorize('PRINCIPAL', 'ADMIN'), getAllUsers);

// Get single user
router.get('/:id', getUserById);

// Create user (principals and admins only)
router.post('/', authorize('PRINCIPAL', 'ADMIN'), createUser);

// Update user (principals and admins only)
router.put('/:id', authorize('PRINCIPAL', 'ADMIN'), updateUser);

// Delete user (admins only)
router.delete('/:id', authorize('ADMIN'), deleteUser);

export default router;
