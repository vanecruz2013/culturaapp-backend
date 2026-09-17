const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const contentController = require('../controllers/contentController');

// GET /content/search?q=&type=movie|book|series|music
router.get('/search', authenticate, contentController.search);

// GET /content/:type/:externalId — detalle de un contenido
router.get('/:type/:externalId', authenticate, contentController.getDetail);

module.exports = router;
