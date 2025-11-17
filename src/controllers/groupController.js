import prisma from '../utils/db.js';

/**
 * Get all groups
 * GET /api/groups
 */
export async function getAllGroups(req, res, next) {
  try {
    // If user is PRINCIPAL or ADMIN, return all groups
    // If TEACHER or STUDENT, return only their groups
    let where = {};

    if (req.user.role === 'STUDENT' || req.user.role === 'TEACHER') {
      where = {
        members: {
          some: {
            userId: req.user.id
          }
        }
      };
    }

    const groups = await prisma.group.findMany({
      where,
      include: {
        _count: {
          select: { members: true, entries: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(groups);
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single group by ID
 * GET /api/groups/:id
 */
export async function getGroupById(req, res, next) {
  try {
    const groupId = parseInt(req.params.id);

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Gruppe nicht gefunden' });
    }

    // Check if user has access to this group
    if (req.user.role !== 'PRINCIPAL' && req.user.role !== 'ADMIN') {
      const isMember = group.members.some(m => m.userId === req.user.id);
      if (!isMember) {
        return res.status(403).json({ error: 'Keine Berechtigung für diese Gruppe' });
      }
    }

    res.json(group);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new group
 * POST /api/groups
 * Only PRINCIPAL and ADMIN
 */
export async function createGroup(req, res, next) {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Gruppenname erforderlich' });
    }

    const group = await prisma.group.create({
      data: { name }
    });

    res.status(201).json(group);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Gruppenname bereits vergeben' });
    }
    next(error);
  }
}

/**
 * Update a group
 * PUT /api/groups/:id
 * Only PRINCIPAL and ADMIN
 */
export async function updateGroup(req, res, next) {
  try {
    const groupId = parseInt(req.params.id);
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Gruppenname erforderlich' });
    }

    const group = await prisma.group.update({
      where: { id: groupId },
      data: { name }
    });

    res.json(group);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Gruppenname bereits vergeben' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Gruppe nicht gefunden' });
    }
    next(error);
  }
}

/**
 * Delete a group
 * DELETE /api/groups/:id
 * Only PRINCIPAL and ADMIN
 */
export async function deleteGroup(req, res, next) {
  try {
    const groupId = parseInt(req.params.id);

    // Check if group has entries
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: { entries: true }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Gruppe nicht gefunden' });
    }

    if (group._count.entries > 0) {
      return res.status(400).json({
        error: 'Gruppe kann nicht gelöscht werden, da sie Einträge enthält'
      });
    }

    await prisma.group.delete({
      where: { id: groupId }
    });

    res.json({ message: 'Gruppe erfolgreich gelöscht' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Gruppe nicht gefunden' });
    }
    next(error);
  }
}

/**
 * Add a user to a group
 * POST /api/groups/:id/members
 * Only PRINCIPAL and ADMIN
 */
export async function addMember(req, res, next) {
  try {
    const groupId = parseInt(req.params.id);
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Benutzer-ID erforderlich' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return res.status(404).json({ error: 'Gruppe nicht gefunden' });
    }

    // Add user to group
    await prisma.userGroup.create({
      data: {
        userId,
        groupId
      }
    });

    res.status(201).json({ message: 'Benutzer erfolgreich zur Gruppe hinzugefügt' });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Benutzer ist bereits in dieser Gruppe' });
    }
    next(error);
  }
}

/**
 * Remove a user from a group
 * DELETE /api/groups/:id/members/:userId
 * Only PRINCIPAL and ADMIN
 */
export async function removeMember(req, res, next) {
  try {
    const groupId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);

    await prisma.userGroup.delete({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      }
    });

    res.json({ message: 'Benutzer erfolgreich aus der Gruppe entfernt' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Benutzer nicht in dieser Gruppe gefunden' });
    }
    next(error);
  }
}

/**
 * Get members of a group
 * GET /api/groups/:id/members
 */
export async function getGroupMembers(req, res, next) {
  try {
    const groupId = parseInt(req.params.id);

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Gruppe nicht gefunden' });
    }

    // Check if user has access to this group
    if (req.user.role !== 'PRINCIPAL' && req.user.role !== 'ADMIN') {
      const isMember = group.members.some(m => m.userId === req.user.id);
      if (!isMember) {
        return res.status(403).json({ error: 'Keine Berechtigung für diese Gruppe' });
      }
    }

    res.json(group.members.map(m => m.user));
  } catch (error) {
    next(error);
  }
}
