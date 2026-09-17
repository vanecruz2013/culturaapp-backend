const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');

// POST /auth/register
router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('El usuario debe tener entre 3 y 30 caracteres')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Solo letras, números y guiones bajos'),
    body('email').isEmail().normalizeEmail().withMessage('Email no válido'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('displayName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('El nombre es obligatorio'),
  ],
  authController.register
);

// POST /auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email no válido'),
    body('password').notEmpty().withMessage('Contraseña requerida'),
  ],
  authController.login
);

// POST /auth/refresh
router.post('/refresh', authController.refresh);

// POST /auth/logout
router.post('/logout', authController.logout);

// POST /auth/forgot-password
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  authController.forgotPassword
);

module.exports = router;
