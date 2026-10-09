const { supabase } = require('../lib/supabase');

// POST /auth/complete-profile
// Llamado una sola vez justo después del registro en Supabase
const completeProfile = async (req, res, next) => {
  try {
    const { username, displayName } = req.body;
    const userId = req.user.id;

    if (!username || !displayName) {
      return res.status(400).json({ error: 'username y displayName son obligatorios' });
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return res.status(400).json({ error: 'Usuario: 3–30 caracteres, solo letras, números y _' });
    }

    // Check username uniqueness
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .neq('id', userId)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username: username.toLowerCase(),
        display_name: displayName,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return next(error);

    res.json(data);
  } catch (err) {
    next(err);
  }
};

// GET /auth/me
const getMe = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = { completeProfile, getMe };
