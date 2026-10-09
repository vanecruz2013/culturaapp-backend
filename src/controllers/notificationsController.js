const { supabase } = require('../lib/supabase');

const getAll = async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const pageSize = 30;
    const from = (parseInt(page) - 1) * pageSize;

    const { data: items, count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) return next(error);
    res.json({ items: items ?? [], total: count ?? 0, page: parseInt(page), totalPages: Math.ceil((count ?? 0) / pageSize) });
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    const { data: notif } = await supabase.from('notifications').select('user_id').eq('id', req.params.id).single();
    if (!notif || notif.user_id !== req.user.id) return res.status(404).json({ error: 'No encontrada' });
    await supabase.from('notifications').update({ read: true }).eq('id', req.params.id);
    res.json({ message: 'Marcada como leída' });
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    await supabase.from('notifications').update({ read: true }).eq('user_id', req.user.id).eq('read', false);
    res.json({ message: 'Todas marcadas como leídas' });
  } catch (err) { next(err); }
};

const unreadCount = async (req, res, next) => {
  try {
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', req.user.id).eq('read', false);
    res.json({ count: count ?? 0 });
  } catch (err) { next(err); }
};

module.exports = { getAll, markRead, markAllRead, unreadCount };
