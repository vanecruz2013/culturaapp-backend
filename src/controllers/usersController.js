const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /users/:username
const getProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        isPrivate: true,
        createdAt: true,
        _count: {
          select: {
            userContent: {
              where: { status: { in: ['WATCHED', 'READ', 'FAVORITE'] } },
            },
          },
        },
      },
    });

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Get recent activity (last 5 items)
    const recentActivity = user.isPrivate
      ? []
      : await prisma.userContent.findMany({
          where: { userId: user.id },
          orderBy: { updatedAt: 'desc' },
          take: 5,
          include: {
            content: {
              select: { title: true, type: true, coverUrl: true, creator: true },
            },
          },
        });

    res.json({ ...user, recentActivity });
  } catch (err) {
    next(err);
  }
};

// PUT /users/me
const updateProfile = async (req, res, next) => {
  try {
    const { displayName, bio, avatarUrl } = req.body;

    if (displayName && (displayName.length < 1 || displayName.length > 50)) {
      return res.status(400).json({ error: 'El nombre debe tener entre 1 y 50 caracteres' });
    }
    if (bio && bio.length > 150) {
      return res.status(400).json({ error: 'La bio no puede superar 150 caracteres' });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true, username: true, displayName: true, bio: true, avatarUrl: true,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// GET /users/me/stats
const getStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [moviesWatched, booksRead, seriesWatched, recommendationsSent, recommendationsFollowed] =
      await Promise.all([
        prisma.userContent.count({ where: { userId, status: 'WATCHED', content: { type: 'MOVIE' } } }),
        prisma.userContent.count({ where: { userId, status: 'READ', content: { type: 'BOOK' } } }),
        prisma.userContent.count({ where: { userId, status: 'WATCHED', content: { type: 'SERIES' } } }),
        prisma.recommendation.count({ where: { senderId: userId } }),
        prisma.recommendation.count({ where: { senderId: userId, status: 'ACKNOWLEDGED' } }),
      ]);

    res.json({
      moviesWatched,
      booksRead,
      seriesWatched,
      recommendationsSent,
      recommendationsFollowed,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, getStats };
