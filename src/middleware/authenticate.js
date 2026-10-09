const { supabase } = require('../lib/supabase');

/**
 * Verifica el JWT emitido por Supabase.
 * El token llega en el header Authorization: Bearer <token>
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticación requerido' });
    }

    const token = authHeader.slice(7);

    // Supabase verifica la firma y la expiración del token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    // Adjuntamos el usuario de Supabase al request
    // user.id es el UUID de Supabase Auth (coincide con profiles.id)
    req.user = {
      id: user.id,
      email: user.email,
    };

    // Enriquecer con datos del perfil (username, displayName)
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url')
      .eq('id', user.id)
      .single();

    if (profile) {
      req.user.username = profile.username;
      req.user.displayName = profile.display_name;
      req.user.avatarUrl = profile.avatar_url;
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate };
