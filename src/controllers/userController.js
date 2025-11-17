import prisma from '../utils/db.js';
import { hashPassword } from '../utils/auth.js';

/**
 * Get all users (with optional filtering)
 * GET /api/users
 * Only PRINCIPAL and ADMIN
 */
export async function getAllUsers(req, res, next) {
  try {
    const { role } = req.query;

    const where = role ? { role } : {};

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      },
      orderBy: { username: 'asc' }
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single user by ID
 * GET /api/users/:id
 */
export async function getUserById(req, res, next) {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        groups: {
          include: {
            group: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new user
 * POST /api/users
 * Only PRINCIPAL and ADMIN
 */
export async function createUser(req, res, next) {
  try {
    const { username, password, role } = req.body;

    // Validate input
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Benutzername, Passwort und Rolle erforderlich' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
    }

    // Validate role
    const validRoles = ['STUDENT', 'TEACHER', 'PRINCIPAL', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Ungültige Rolle' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json(user);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Benutzername bereits vergeben' });
    }
    next(error);
  }
}

/**
 * Update a user
 * PUT /api/users/:id
 * Only PRINCIPAL and ADMIN
 */
export async function updateUser(req, res, next) {
  try {
    const userId = parseInt(req.params.id);
    const { username, role, password } = req.body;

    const data = {};

    if (username) data.username = username;
    if (role) {
      const validRoles = ['STUDENT', 'TEACHER', 'PRINCIPAL', 'ADMIN'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Ungültige Rolle' });
      }
      data.role = role;
    }
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
      }
      data.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    res.json(user);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Benutzername bereits vergeben' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
    next(error);
  }
}

/**
 * Delete a user
 * DELETE /api/users/:id
 * Only ADMIN (hard delete)
 */
export async function deleteUser(req, res, next) {
  try {
    const userId = parseInt(req.params.id);

    // Prevent deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Sie können sich nicht selbst löschen' });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'Benutzer erfolgreich gelöscht' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
    next(error);
  }
}
