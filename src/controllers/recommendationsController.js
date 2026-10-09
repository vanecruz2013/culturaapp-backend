const { supabase } = require('../lib/supabase');

// POST /recommendations
const send = async (req, res, next) => {
  try {
    const { receiverUsername, contentId, message } = req.body;
    const senderId = req.user.id;

    if (!receiverUsername || !contentId) {
      return res.status(400).json({ error: 'receiverUsername y contentId son obligatorios' });
    }
    if (receiverUsername === req.user.username) {
      return res.status(400).json({ error: 'No puedes recomendarte contenido a ti mismo' });
    }
    if (message && message.length > 200) {
      return res.status(400).json({ error: 'El mensaje no puede superar 200 caracteres' });
    }

    const { data: receiver } = await supabase.from('profiles').select('id').eq('username', receiverUsername.toLowerCase()).single();
    if (!receiver) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { data: content } = await supabase.from('content').select('id, title, type, cover_url').eq('id', contentId).single();
    if (!content) return res.status(404).json({ error: 'Contenido no encontrado' });

    // Check for existing pending recommendation
    const { data: existing } = await supabase
      .from('recommendations')
      .select('id')
      .eq('sender_id', senderId)
      .eq('receiver_id', receiver.id)
      .eq('content_id', contentId)
      .eq('status', 'PENDING')
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Ya tienes una recomendación pendiente para ese usuario' });
    }

    const { data: recommendation, error } = await supabase
      .from('recommendations')
      .insert({ sender_id: senderId, receiver_id: receiver.id, content_id: contentId, message: message ?? null })
      .select()
      .single();

    if (error) return next(error);

    // Notification for receiver
    await supabase.from('notifications').insert({
      user_id: receiver.id,
      type: 'RECOMMENDATION_RECEIVED',
      data: {
        recommendationId: recommendation.id,
        senderId,
        senderUsername: req.user.username,
        senderDisplayName: req.user.displayName,
        contentId,
        contentTitle: content.title,
        contentType: content.type,
        contentCoverUrl: content.cover_url,
        message: message ?? null,
      },
    });

    res.status(201).json(recommendation);
  } catch (err) {
    next(err);
  }
};

// GET /recommendations/received
const getReceived = async (req, res, next) => {
  try {
    const { status, page = 1 } = req.query;
    const pageSize = 20;
    const from = (parseInt(page) - 1) * pageSize;

    let query = supabase
      .from('recommendations')
      .select('*, sender:profiles!sender_id(username,display_name,avatar_url), content(*)', { count: 'exact' })
      .eq('receiver_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (status) query = query.eq('status', status);

    const { data: items, count, error } = await query;
    if (error) return next(error);

    res.json({ items: items ?? [], total: count ?? 0, page: parseInt(page), totalPages: Math.ceil((count ?? 0) / pageSize) });
  } catch (err) {
    next(err);
  }
};

// GET /recommendations/sent
const getSent = async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const pageSize = 20;
    const from = (parseInt(page) - 1) * pageSize;

    const { data: items, count, error } = await supabase
      .from('recommendations')
      .select('*, receiver:profiles!receiver_id(username,display_name,avatar_url), content(*)', { count: 'exact' })
      .eq('sender_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) return next(error);
    res.json({ items: items ?? [], total: count ?? 0, page: parseInt(page), totalPages: Math.ceil((count ?? 0) / pageSize) });
  } catch (err) {
    next(err);
  }
};

// PATCH /recommendations/:id/status
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const ALLOWED = ['SAVED', 'ACKNOWLEDGED', 'IGNORED'];
    if (!ALLOWED.includes(status)) {
      return res.status(400).json({ error: `Estado inválido. Válidos: ${ALLOWED.join(', ')}` });
    }

    const { data: rec } = await supabase.from('recommendations').select('*').eq('id', id).single();
    if (!rec) return res.status(404).json({ error: 'Recomendación no encontrada' });
    if (rec.receiver_id !== req.user.id) return res.status(403).json({ error: 'Sin permiso' });

    const { data: updated, error } = await supabase
      .from('recommendations')
      .update({
        status,
        ...(status === 'ACKNOWLEDGED' && { acknowledged_at: new Date().toISOString() }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return next(error);

    // Notify sender if acknowledged
    if (status === 'ACKNOWLEDGED') {
      const { data: content } = await supabase.from('content').select('title, type').eq('id', rec.content_id).single();
      await supabase.from('notifications').insert({
        user_id: rec.sender_id,
        type: 'RECOMMENDATION_FOLLOWED',
        data: {
          recommendationId: id,
          receiverId: req.user.id,
          receiverUsername: req.user.username,
          receiverDisplayName: req.user.displayName,
          contentId: rec.content_id,
          contentTitle: content?.title,
          contentType: content?.type,
        },
      });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

module.exports = { send, getReceived, getSent, updateStatus };
