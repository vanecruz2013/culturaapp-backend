const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const usersController = require('../controllers/usersController');

// GET /users/:username — perfil público
router.get('/:username', usersController.getProfile);

// PUT /users/me — editar perfil propio
router.put('/me', authenticate, usersController.updateProfile);

// GET /users/me/stats — estadísticas del usuario
router.get('/me/stats', authenticate, usersController.getStats);

module.exports = router;
