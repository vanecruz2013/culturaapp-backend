const { searchMovies, searchSeries, getMovieDetail, getSeriesDetail } = require('../services/tmdbService');
const { searchBooks, getBookDetail } = require('../services/booksService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /content/search?q=&type=movie|book|series|all&page=1
const search = async (req, res, next) => {
  try {
    const { q, type = 'all', page = 1 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'La búsqueda debe tener al menos 2 caracteres' });
    }

    const results = {};

    if (type === 'all' || type === 'movie') {
      results.movies = await searchMovies(q, parseInt(page));
    }
    if (type === 'all' || type === 'series') {
      results.series = await searchSeries(q, parseInt(page));
    }
    if (type === 'all' || type === 'book') {
      results.books = await searchBooks(q, parseInt(page) - 1);
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
};

// GET /content/:type/:externalId
const getDetail = async (req, res, next) => {
  try {
    const { type, externalId } = req.params;

    // Check if we already have it in our DB (cached)
    let dbContent = await prisma.content.findUnique({
      where: {
        type_externalId: {
          type: type.toUpperCase(),
          externalId,
        },
      },
    });

    // Fetch fresh data from external API
    let externalData;
    switch (type) {
      case 'movie':
        externalData = await getMovieDetail(externalId);
        break;
      case 'series':
        externalData = await getSeriesDetail(externalId);
        break;
      case 'book':
        externalData = await getBookDetail(externalId);
        break;
      default:
        return res.status(400).json({ error: 'Tipo de contenido no válido' });
    }

    // Upsert in our DB (cache it)
    dbContent = await prisma.content.upsert({
      where: {
        type_externalId: {
          type: externalData.type,
          externalId: externalData.externalId,
        },
      },
      create: {
        type: externalData.type,
        externalId: externalData.externalId,
        title: externalData.title,
        subtitle: externalData.subtitle,
        creator: externalData.creator,
        year: externalData.year,
        genre: externalData.genre,
        coverUrl: externalData.coverUrl,
        synopsis: externalData.synopsis,
      },
      update: {
        title: externalData.title,
        coverUrl: externalData.coverUrl,
        synopsis: externalData.synopsis,
      },
    });

    // Get platform stats (how many users have it)
    const stats = await prisma.userContent.aggregate({
      where: { contentId: dbContent.id },
      _count: true,
      _avg: { rating: true },
    });

    // If user is logged in, get their status for this content
    const userEntry = req.user
      ? await prisma.userContent.findUnique({
          where: { userId_contentId: { userId: req.user.id, contentId: dbContent.id } },
        })
      : null;

    res.json({
      ...dbContent,
      ...externalData, // extra fields like runtime, pageCount, etc.
      platformStats: {
        totalUsers: stats._count,
        averageRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : null,
      },
      userStatus: userEntry,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { search, getDetail };
