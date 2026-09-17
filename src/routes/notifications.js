const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const notificationsController = require('../controllers/notificationsController');

// GET /notifications
router.get('/', authenticate, notificationsController.getAll);

// PATCH /notifications/:id/read — marcar como leída
router.patch('/:id/read', authenticate, notificationsController.markRead);

// PATCH /notifications/read-all — marcar todas como leídas
router.patch('/read-all', authenticate, notificationsController.markAllRead);

// GET /notifications/unread-count
router.get('/unread-count', authenticate, notificationsController.unreadCount);

module.exports = router;
