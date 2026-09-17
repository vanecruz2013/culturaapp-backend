const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /recommendations
// Body: { receiverUsername, contentId, message? }
const send = async (req, res, next) => {
  try {
    const { receiverUsername, contentId, message } = req.body;
    const senderId = req.user.id;

    if (!receiverUsername || !contentId) {
      return res.status(400).json({ error: 'receiverUsername y contentId son obligatorios' });
    }

    // Can't recommend to yourself
    if (receiverUsername === req.user.username) {
      return res.status(400).json({ error: 'No puedes recomendarte contenido a ti mismo' });
    }

    if (message && message.length > 200) {
      return res.status(400).json({ error: 'El mensaje no puede superar 200 caracteres' });
    }

    // Find receiver
    const receiver = await prisma.user.findUnique({ where: { username: receiverUsername } });
    if (!receiver) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Find content
    const content = await prisma.content.findUnique({ where: { id: contentId } });
    if (!content) return res.status(404).json({ error: 'Contenido no encontrado' });

    // Check if already sent and pending
    const existing = await prisma.recommendation.findFirst({
      where: { senderId, receiverId: receiver.id, contentId, status: 'PENDING' },
    });
    if (existing) {
      return res.status(409).json({ error: 'Ya tienes una recomendación pendiente de este contenido para ese usuario' });
    }

    const recommendation = await prisma.recommendation.create({
      data: { senderId, receiverId: receiver.id, contentId, message: message || null },
      include: {
        content: { select: { title: true, type: true, coverUrl: true } },
        receiver: { select: { username: true, displayName: true } },
      },
    });

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiver.id,
        type: 'RECOMMENDATION_RECEIVED',
        data: {
          recommendationId: recommendation.id,
          senderId,
          senderUsername: req.user.username,
          senderDisplayName: req.user.displayName,
          contentId,
          contentTitle: content.title,
          contentType: content.type,
          contentCoverUrl: content.coverUrl,
          message: message || null,
        },
      },
    });

    res.status(201).json(recommendation);
  } catch (err) {
    next(err);
  }
};

// GET /recommendations/received?status=PENDING&page=1
const getReceived = async (req, res, next) => {
  try {
    const { status, page = 1 } = req.query;
    const take = 20;
    const skip = (parseInt(page) - 1) * take;

    const where = { receiverId: req.user.id };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.recommendation.findMany({
        where,
        include: {
          sender: { select: { username: true, displayName: true, avatarUrl: true } },
          content: { select: { id: true, title: true, type: true, coverUrl: true, creator: true, year: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.recommendation.count({ where }),
    ]);

    res.json({ items, total, page: parseInt(page), totalPages: Math.ceil(total / take) });
  } catch (err) {
    next(err);
  }
};

// GET /recommendations/sent
const getSent = async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const take = 20;
    const skip = (parseInt(page) - 1) * take;

    const where = { senderId: req.user.id };

    const [items, total] = await Promise.all([
      prisma.recommendation.findMany({
        where,
        include: {
          receiver: { select: { username: true, displayName: true, avatarUrl: true } },
          content: { select: { id: true, title: true, type: true, coverUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.recommendation.count({ where }),
    ]);

    res.json({ items, total, page: parseInt(page), totalPages: Math.ceil(total / take) });
  } catch (err) {
    next(err);
  }
};

// PATCH /recommendations/:id/status
// Body: { status: 'SAVED' | 'ACKNOWLEDGED' | 'IGNORED' }
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const ALLOWED = ['SAVED', 'ACKNOWLEDGED', 'IGNORED'];
    if (!ALLOWED.includes(status)) {
      return res.status(400).json({ error: `Estado inválido. Válidos: ${ALLOWED.join(', ')}` });
    }

    const recommendation = await prisma.recommendation.findUnique({ where: { id } });
    if (!recommendation) return res.status(404).json({ error: 'Recomendación no encontrada' });
    if (recommendation.receiverId !== req.user.id) {
      return res.status(403).json({ error: 'No puedes modificar esta recomendación' });
    }

    const updated = await prisma.recommendation.update({
      where: { id },
      data: {
        status,
        ...(status === 'ACKNOWLEDGED' && { acknowledgedAt: new Date() }),
      },
    });

    // If ACKNOWLEDGED: notify the sender
    if (status === 'ACKNOWLEDGED') {
      const content = await prisma.content.findUnique({
        where: { id: recommendation.contentId },
        select: { title: true, type: true },
      });

      await prisma.notification.create({
        data: {
          userId: recommendation.senderId,
          type: 'RECOMMENDATION_FOLLOWED',
          data: {
            recommendationId: id,
            receiverId: req.user.id,
            receiverUsername: req.user.username,
            receiverDisplayName: req.user.displayName,
            contentId: recommendation.contentId,
            contentTitle: content.title,
            contentType: content.type,
          },
        },
      });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

module.exports = { send, getReceived, getSent, updateStatus };
