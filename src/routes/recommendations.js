const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const rec = require('../controllers/recommendationsController');

// POST /recommendations — enviar una recomendación
router.post('/', authenticate, rec.send);

// GET /recommendations/received — recomendaciones recibidas
router.get('/received', authenticate, rec.getReceived);

// GET /recommendations/sent — recomendaciones enviadas
router.get('/sent', authenticate, rec.getSent);

// PATCH /recommendations/:id/status — actualizar estado (saved, acknowledged, ignored)
router.patch('/:id/status', authenticate, rec.updateStatus);

module.exports = router;
