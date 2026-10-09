const { supabase } = require('../lib/supabase');

const VALID_STATUSES = {
  MOVIE:        ['WATCHED', 'WANT_TO_WATCH'],
  BOOK:         ['READ', 'READING', 'WANT_TO_READ'],
  SERIES:       ['WATCHED', 'WATCHING', 'WANT_TO_WATCH'],
  MUSIC_ARTIST: ['FAVORITE'],
  MUSIC_ALBUM:  ['FAVORITE'],
  MUSIC_TRACK:  ['FAVORITE'],
};

// GET /user-content?type=MOVIE&status=WATCHED&page=1
const getMyList = async (req, res, next) => {
  try {
    const { type, status, page = 1 } = req.query;
    const pageSize = 20;
    const from = (parseInt(page) - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('user_content')
      .select('*, content(*)', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);
    if (type)   query = query.eq('content_type', type);

    const { data: items, count, error } = await query;
    if (error) return next(error);

    res.json({
      items: items ?? [],
      total: count ?? 0,
      page: parseInt(page),
      totalPages: Math.ceil((count ?? 0) / pageSize),
    });
  } catch (err) {
    next(err);
  }
};

// POST /user-content
const upsert = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { contentId, status, rating, review, isFavorite, progressValue, progressTotal, dateStarted, dateFinished } = req.body;

    if (!contentId || !status) {
      return res.status(400).json({ error: 'contentId y status son obligatorios' });
    }

    // Validate content exists and get type
    const { data: content } = await supabase.from('content').select('id, type').eq('id', contentId).single();
    if (!content) return res.status(404).json({ error: 'Contenido no encontrado' });

    const validStatuses = VALID_STATUSES[content.type] ?? [];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Estado inválido. Válidos: ${validStatuses.join(', ')}` });
    }
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'La puntuación debe estar entre 1 y 5' });
    }

    const { data, error } = await supabase
      .from('user_content')
      .upsert({
        user_id: userId,
        content_id: contentId,
        content_type: content.type,
        status,
        ...(rating      !== undefined && { rating }),
        ...(review      !== undefined && { review }),
        ...(isFavorite  !== undefined && { is_favorite: isFavorite }),
        ...(progressValue !== undefined && { progress_value: progressValue }),
        ...(progressTotal !== undefined && { progress_total: progressTotal }),
        ...(dateStarted  && { date_started: dateStarted }),
        ...(dateFinished && { date_finished: dateFinished }),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,content_id' })
      .select('*, content(*)')
      .single();

    if (error) return next(error);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// DELETE /user-content/:contentId
const remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('user_content')
      .delete()
      .eq('user_id', req.user.id)
      .eq('content_id', req.params.contentId);

    if (error) return next(error);
    res.json({ message: 'Eliminado de tu lista' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyList, upsert, remove };
