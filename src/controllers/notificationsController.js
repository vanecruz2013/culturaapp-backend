const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /notifications?page=1
const getAll = async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const take = 30;
    const skip = (parseInt(page) - 1) * take;

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.notification.count({ where: { userId: req.user.id } }),
    ]);

    res.json({ items, total, page: parseInt(page), totalPages: Math.ceil(total / take) });
  } catch (err) {
    next(err);
  }
};

// PATCH /notifications/:id/read
const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== req.user.id) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    await prisma.notification.update({ where: { id }, data: { read: true } });
    res.json({ message: 'Marcada como leída' });
  } catch (err) {
    next(err);
  }
};

// PATCH /notifications/read-all
const markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });
    res.json({ message: 'Todas marcadas como leídas' });
  } catch (err) {
    next(err);
  }
};

// GET /notifications/unread-count
const unreadCount = async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, read: false },
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, markRead, markAllRead, unreadCount };
