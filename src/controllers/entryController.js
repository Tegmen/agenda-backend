import prisma from '../utils/db.js';
import { getWeekDateRange, parseDisplayDate } from '../utils/dateHelpers.js';

/**
 * Get entries for a specific week
 * GET /api/entries/week/:year/:week
 * Returns entries for the user's groups for the specified week
 */
export async function getEntriesForWeek(req, res, next) {
  try {
    const year = parseInt(req.params.year);
    const week = parseInt(req.params.week);
    const { groupIds } = req.query; // Optional: filter by specific groups

    // Validate inputs
    if (isNaN(year) || isNaN(week) || week < 1 || week > 53) {
      return res.status(400).json({ error: 'Ungültiges Jahr oder Wochennummer' });
    }

    // Get date range for the week
    const { startDate, endDate } = getWeekDateRange(year, week);

    // Build query conditions
    let where = {
      displayDate: {
        gte: startDate,
        lte: endDate
      }
    };

    // Filter by deleted status based on role
    if (req.user.role === 'STUDENT') {
      where.isDeleted = false;
    }
    // Teachers, principals, and admins can see deleted entries

    // Filter by groups
    if (req.user.role === 'PRINCIPAL' || req.user.role === 'ADMIN') {
      // Principals and admins can see all entries
      // Optional: filter by specific group IDs
      if (groupIds) {
        const ids = groupIds.split(',').map(id => parseInt(id));
        where.groupId = { in: ids };
      }
    } else {
      // Students and teachers can only see entries from their groups
      // Get user's group IDs
      const userGroups = await prisma.userGroup.findMany({
        where: { userId: req.user.id },
        select: { groupId: true }
      });

      const userGroupIds = userGroups.map(ug => ug.groupId);

      // Also include "public" group if it exists
      const publicGroup = await prisma.group.findFirst({
        where: { name: 'public' }
      });

      if (publicGroup) {
        userGroupIds.push(publicGroup.id);
      }

      if (groupIds) {
        // Filter by requested groups that the user is a member of
        const requestedIds = groupIds.split(',').map(id => parseInt(id));
        const allowedIds = requestedIds.filter(id => userGroupIds.includes(id));
        where.groupId = { in: allowedIds };
      } else {
        where.groupId = { in: userGroupIds };
      }
    }

    // Fetch entries
    const entries = await prisma.entry.findMany({
      where,
      include: {
        group: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true
          }
        },
        editedBy: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      },
      orderBy: [
        { displayDate: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    res.json(entries);
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single entry by ID
 * GET /api/entries/:id
 */
export async function getEntryById(req, res, next) {
  try {
    const entryId = parseInt(req.params.id);

    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      include: {
        group: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true
          }
        },
        editedBy: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      }
    });

    if (!entry) {
      return res.status(404).json({ error: 'Eintrag nicht gefunden' });
    }

    // Check permissions
    if (!await canViewEntry(req.user, entry)) {
      return res.status(403).json({ error: 'Keine Berechtigung für diesen Eintrag' });
    }

    res.json(entry);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new entry
 * POST /api/entries
 */
export async function createEntry(req, res, next) {
  try {
    const { title, description, displayDate, type, groupId } = req.body;

    // Validate input
    if (!title || !description || !displayDate || !groupId) {
      return res.status(400).json({
        error: 'Titel, Beschreibung, Anzeigdatum und Gruppe erforderlich'
      });
    }

    // Validate entry type
    const validTypes = ['HOMEWORK', 'EVENT', 'EXAM', 'REMINDER', 'OTHER'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ error: 'Ungültiger Eintragstyp' });
    }

    // Check if user is a member of the group (or is principal/admin)
    if (req.user.role !== 'PRINCIPAL' && req.user.role !== 'ADMIN') {
      const isMember = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId: req.user.id,
            groupId: parseInt(groupId)
          }
        }
      });

      if (!isMember) {
        return res.status(403).json({ error: 'Sie sind kein Mitglied dieser Gruppe' });
      }
    }

    // Parse display date
    const parsedDate = parseDisplayDate(displayDate);

    // Create entry
    const entry = await prisma.entry.create({
      data: {
        title,
        description,
        displayDate: parsedDate,
        type: type || 'OTHER',
        groupId: parseInt(groupId),
        createdById: req.user.id
      },
      include: {
        group: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      }
    });

    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
}

/**
 * Update an entry
 * PUT /api/entries/:id
 * Creates a new entry and marks the old one as deleted (edit history)
 */
export async function updateEntry(req, res, next) {
  try {
    const entryId = parseInt(req.params.id);
    const { title, description, displayDate, type } = req.body;

    // Get original entry
    const originalEntry = await prisma.entry.findUnique({
      where: { id: entryId },
      include: { group: true }
    });

    if (!originalEntry) {
      return res.status(404).json({ error: 'Eintrag nicht gefunden' });
    }

    // Check permissions
    if (!await canEditEntry(req.user, originalEntry)) {
      return res.status(403).json({ error: 'Keine Berechtigung zum Bearbeiten dieses Eintrags' });
    }

    // Validate entry type if provided
    if (type) {
      const validTypes = ['HOMEWORK', 'EVENT', 'EXAM', 'REMINDER', 'OTHER'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Ungültiger Eintragstyp' });
      }
    }

    // Mark original entry as deleted
    await prisma.entry.update({
      where: { id: entryId },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    // Create new entry with updated data
    const newEntry = await prisma.entry.create({
      data: {
        title: title || originalEntry.title,
        description: description || originalEntry.description,
        displayDate: displayDate ? parseDisplayDate(displayDate) : originalEntry.displayDate,
        type: type || originalEntry.type,
        groupId: originalEntry.groupId,
        createdById: originalEntry.createdById,
        editedById: req.user.id
      },
      include: {
        group: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true
          }
        },
        editedBy: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      }
    });

    res.json(newEntry);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an entry
 * DELETE /api/entries/:id
 * Soft delete for students/teachers, hard delete for admins
 */
export async function deleteEntry(req, res, next) {
  try {
    const entryId = parseInt(req.params.id);

    // Get entry
    const entry = await prisma.entry.findUnique({
      where: { id: entryId }
    });

    if (!entry) {
      return res.status(404).json({ error: 'Eintrag nicht gefunden' });
    }

    // Check permissions
    if (!await canDeleteEntry(req.user, entry)) {
      return res.status(403).json({ error: 'Keine Berechtigung zum Löschen dieses Eintrags' });
    }

    // Admin can hard delete
    if (req.user.role === 'ADMIN') {
      await prisma.entry.delete({
        where: { id: entryId }
      });
      return res.json({ message: 'Eintrag dauerhaft gelöscht' });
    }

    // Others can only soft delete
    await prisma.entry.update({
      where: { id: entryId },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    res.json({ message: 'Eintrag gelöscht' });
  } catch (error) {
    next(error);
  }
}

/**
 * Get deleted entries (teachers, principals, admins only)
 * GET /api/entries/deleted
 */
export async function getDeletedEntries(req, res, next) {
  try {
    // Only teachers and above can view deleted entries
    if (req.user.role === 'STUDENT') {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    let where = { isDeleted: true };

    // Teachers can only see deleted entries from their groups
    if (req.user.role === 'TEACHER') {
      const userGroups = await prisma.userGroup.findMany({
        where: { userId: req.user.id },
        select: { groupId: true }
      });

      const userGroupIds = userGroups.map(ug => ug.groupId);
      where.groupId = { in: userGroupIds };
    }

    const entries = await prisma.entry.findMany({
      where,
      include: {
        group: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true
          }
        },
        editedBy: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      },
      orderBy: { deletedAt: 'desc' }
    });

    res.json(entries);
  } catch (error) {
    next(error);
  }
}

// Helper functions for permission checks

async function canViewEntry(user, entry) {
  // Principals and admins can view all entries
  if (user.role === 'PRINCIPAL' || user.role === 'ADMIN') {
    return true;
  }

  // Students can't view deleted entries
  if (user.role === 'STUDENT' && entry.isDeleted) {
    return false;
  }

  // Check if user is a member of the entry's group
  const isMember = await prisma.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId: user.id,
        groupId: entry.groupId
      }
    }
  });

  return !!isMember;
}

async function canEditEntry(user, entry) {
  // Already deleted entries can't be edited
  if (entry.isDeleted) {
    return false;
  }

  // Principals and admins can edit all entries
  if (user.role === 'PRINCIPAL' || user.role === 'ADMIN') {
    return true;
  }

  // Teachers can edit all entries in their groups
  if (user.role === 'TEACHER') {
    const isMember = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: entry.groupId
        }
      }
    });
    return !!isMember;
  }

  // Students can only edit their own entries
  if (user.role === 'STUDENT') {
    return entry.createdById === user.id;
  }

  return false;
}

async function canDeleteEntry(user, entry) {
  // Already deleted entries can't be deleted again (except hard delete by admin)
  if (entry.isDeleted && user.role !== 'ADMIN') {
    return false;
  }

  // Admins can delete anything
  if (user.role === 'ADMIN') {
    return true;
  }

  // Principals can delete all entries
  if (user.role === 'PRINCIPAL') {
    return true;
  }

  // Teachers can delete all entries in their groups
  if (user.role === 'TEACHER') {
    const isMember = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: entry.groupId
        }
      }
    });
    return !!isMember;
  }

  // Students can only delete their own entries
  if (user.role === 'STUDENT') {
    return entry.createdById === user.id;
  }

  return false;
}
