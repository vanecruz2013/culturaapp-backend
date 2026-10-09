const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const authController = require('../controllers/authController');

/**
 * Con Supabase, el registro y login ocurren directamente en la app móvil
 * usando el SDK de Supabase (@supabase/supabase-js).
 * El backend solo necesita:
 * - Un endpoint para completar el perfil tras el registro (username, displayName)
 * - Verificación de token en las rutas protegidas (via middleware authenticate)
 */

// POST /auth/complete-profile — se llama una vez tras registrarse en Supabase
// Body: { username, displayName }
router.post('/complete-profile', authenticate, authController.completeProfile);

// GET /auth/me — devuelve el perfil del usuario autenticado
router.get('/me', authenticate, authController.getMe);

module.exports = router;
