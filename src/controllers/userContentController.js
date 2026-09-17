const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Valid status values per content type
const VALID_STATUSES = {
  MOVIE: ['WATCHED', 'WANT_TO_WATCH'],
  BOOK: ['READ', 'READING', 'WANT_TO_READ'],
  SERIES: ['WATCHED', 'WATCHING', 'WANT_TO_WATCH'],
  MUSIC_ARTIST: ['FAVORITE'],
  MUSIC_ALBUM: ['FAVORITE'],
  MUSIC_TRACK: ['FAVORITE'],
};

// GET /user-content?type=MOVIE&status=WATCHED&page=1
const getMyList = async (req, res, next) => {
  try {
    const { type, status, page = 1 } = req.query;
    const take = 20;
    const skip = (parseInt(page) - 1) * take;

    const where = { userId: req.user.id };
    if (type) where.content = { type };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.userContent.findMany({
        where,
        include: {
          content: {
            select: { id: true, type: true, title: true, creator: true, year: true, coverUrl: true, genre: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take,
        skip,
      }),
      prisma.userContent.count({ where }),
    ]);

    res.json({ items, total, page: parseInt(page), totalPages: Math.ceil(total / take) });
  } catch (err) {
    next(err);
  }
};

// POST /user-content
// Body: { contentId, status, rating?, review?, isFavorite?, progressValue?, progressTotal?, dateStarted?, dateFinished? }
const upsert = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      contentId,
      status,
      rating,
      review,
      isFavorite,
      progressValue,
      progressTotal,
      dateStarted,
      dateFinished,
      recommendedById,
    } = req.body;

    if (!contentId) return res.status(400).json({ error: 'contentId requerido' });
    if (!status) return res.status(400).json({ error: 'status requerido' });

    // Validate content exists
    const content = await prisma.content.findUnique({ where: { id: contentId } });
    if (!content) return res.status(404).json({ error: 'Contenido no encontrado' });

    // Validate status for content type
    const validStatuses = VALID_STATUSES[content.type] || [];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Estado inválido para ${content.type}. Válidos: ${validStatuses.join(', ')}`,
      });
    }

    // Validate rating
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'La puntuación debe estar entre 1 y 5' });
    }

    // Review only allowed if status is WATCHED or READ
    if (review && !['WATCHED', 'READ'].includes(status)) {
      return res.status(400).json({ error: 'Solo puedes escribir reseña si has terminado el contenido' });
    }

    const entry = await prisma.userContent.upsert({
      where: { userId_contentId: { userId, contentId } },
      create: {
        userId,
        contentId,
        status,
        ...(rating !== undefined && { rating }),
        ...(review !== undefined && { review }),
        ...(isFavorite !== undefined && { isFavorite }),
        ...(progressValue !== undefined && { progressValue }),
        ...(progressTotal !== undefined && { progressTotal }),
        ...(dateStarted && { dateStarted: new Date(dateStarted) }),
        ...(dateFinished && { dateFinished: new Date(dateFinished) }),
        ...(recommendedById && { recommendedById }),
      },
      update: {
        status,
        ...(rating !== undefined && { rating }),
        ...(review !== undefined && { review }),
        ...(isFavorite !== undefined && { isFavorite }),
        ...(progressValue !== undefined && { progressValue }),
        ...(progressTotal !== undefined && { progressTotal }),
        ...(dateStarted && { dateStarted: new Date(dateStarted) }),
        ...(dateFinished && { dateFinished: new Date(dateFinished) }),
      },
      include: { content: true },
    });

    res.status(200).json(entry);
  } catch (err) {
    next(err);
  }
};

// DELETE /user-content/:contentId
const remove = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    await prisma.userContent.deleteMany({
      where: { userId: req.user.id, contentId },
    });
    res.json({ message: 'Eliminado de tu lista' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyList, upsert, remove };
