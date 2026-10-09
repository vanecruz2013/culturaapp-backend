const { supabase } = require('../lib/supabase');
const { searchMovies, searchSeries, getMovieDetail, getSeriesDetail } = require('../services/tmdbService');
const { searchBooks, getBookDetail } = require('../services/booksService');

// GET /content/search?q=&type=movie|book|series|all&page=1
const search = async (req, res, next) => {
  try {
    const { q, type = 'all', page = 1 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'La búsqueda debe tener al menos 2 caracteres' });
    }

    const results = {};
    if (type === 'all' || type === 'movie') results.movies = await searchMovies(q, parseInt(page));
    if (type === 'all' || type === 'series') results.series = await searchSeries(q, parseInt(page));
    if (type === 'all' || type === 'book') results.books = await searchBooks(q, parseInt(page) - 1);

    res.json(results);
  } catch (err) {
    next(err);
  }
};

// GET /content/:type/:externalId
const getDetail = async (req, res, next) => {
  try {
    const { type, externalId } = req.params;

    // Check Supabase cache first
    const { data: cached } = await supabase
      .from('content')
      .select('*')
      .eq('type', type.toUpperCase())
      .eq('external_id', externalId)
      .single();

    // Fetch fresh from external API
    let externalData;
    switch (type) {
      case 'movie':   externalData = await getMovieDetail(externalId); break;
      case 'series':  externalData = await getSeriesDetail(externalId); break;
      case 'book':    externalData = await getBookDetail(externalId); break;
      default: return res.status(400).json({ error: 'Tipo no válido: movie | book | series' });
    }

    // Upsert into Supabase (cache)
    const { data: content, error: upsertError } = await supabase
      .from('content')
      .upsert({
        type: externalData.type,
        external_id: externalData.externalId,
        title: externalData.title,
        subtitle: externalData.subtitle ?? null,
        creator: externalData.creator ?? null,
        year: externalData.year ?? null,
        genre: externalData.genre ?? null,
        cover_url: externalData.coverUrl ?? null,
        synopsis: externalData.synopsis ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'type,external_id' })
      .select()
      .single();

    if (upsertError) return next(upsertError);

    // Platform stats
    const { data: statsRows } = await supabase
      .from('user_content')
      .select('rating')
      .eq('content_id', content.id)
      .not('rating', 'is', null);

    const ratings = (statsRows ?? []).map((r) => r.rating);
    const avgRating = ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null;

    // User's own entry
    const { data: userEntry } = await supabase
      .from('user_content')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('content_id', content.id)
      .single();

    res.json({
      ...content,
      ...externalData,
      platformStats: { totalUsers: statsRows?.length ?? 0, averageRating: avgRating },
      userStatus: userEntry ?? null,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { search, getDetail };
