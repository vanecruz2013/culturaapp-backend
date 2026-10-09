const { supabase } = require('../lib/supabase');

// GET /users/:username
const getProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Recent activity (last 5 items)
    const { data: recentActivity } = await supabase
      .from('user_content')
      .select('*, content(*)')
      .eq('user_id', profile.id)
      .in('status', ['WATCHED', 'READ', 'FAVORITE'])
      .order('updated_at', { ascending: false })
      .limit(5);

    // Counts
    const { count: moviesCount } = await supabase
      .from('user_content')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('status', 'WATCHED');

    const { count: booksCount } = await supabase
      .from('user_content')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('status', 'READ');

    res.json({
      ...profile,
      counts: { movies: moviesCount ?? 0, books: booksCount ?? 0 },
      recentActivity: profile.is_private ? [] : (recentActivity ?? []),
    });
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

    const updates = { updated_at: new Date().toISOString() };
    if (displayName !== undefined) updates.display_name = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) return next(error);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// GET /users/me/stats
const getStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [
      { count: moviesWatched },
      { count: booksRead },
      { count: seriesWatched },
      { count: recommendationsSent },
      { count: recommendationsFollowed },
    ] = await Promise.all([
      supabase.from('user_content').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'WATCHED').eq('content_type', 'MOVIE'),
      supabase.from('user_content').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'READ'),
      supabase.from('user_content').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'WATCHED').eq('content_type', 'SERIES'),
      supabase.from('recommendations').select('*', { count: 'exact', head: true }).eq('sender_id', userId),
      supabase.from('recommendations').select('*', { count: 'exact', head: true }).eq('sender_id', userId).eq('status', 'ACKNOWLEDGED'),
    ]);

    res.json({ moviesWatched, booksRead, seriesWatched, recommendationsSent, recommendationsFollowed });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, getStats };
