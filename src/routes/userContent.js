const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const userContentController = require('../controllers/userContentController');

// GET /user-content — lista del usuario autenticado
router.get('/', authenticate, userContentController.getMyList);

// POST /user-content — añadir o actualizar un contenido
router.post('/', authenticate, userContentController.upsert);

// DELETE /user-content/:contentId — eliminar de la lista
router.delete('/:contentId', authenticate, userContentController.remove);

module.exports = router;
