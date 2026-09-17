const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
  return { accessToken, refreshToken };
};

// POST /auth/register
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, displayName } = req.body;

    // Check uniqueness
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      const field = existing.email === email ? 'email' : 'username';
      return res.status(409).json({ error: `Este ${field} ya está en uso` });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username, email, passwordHash, displayName },
      select: { id: true, username: true, email: true, displayName: true, createdAt: true },
    });

    const tokens = generateTokens(user.id);
    res.status(201).json({ user, ...tokens });
  } catch (err) {
    next(err);
  }
};

// POST /auth/login
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const tokens = generateTokens(user.id);
    const { passwordHash, ...userSafe } = user;
    res.json({ user: userSafe, ...tokens });
  } catch (err) {
    next(err);
  }
};

// POST /auth/refresh
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken requerido' });
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (payload.type !== 'refresh') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

    const tokens = generateTokens(user.id);
    res.json(tokens);
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    next(err);
  }
};

// POST /auth/logout  (client-side: just discard the token)
const logout = (req, res) => res.json({ message: 'Sesión cerrada' });

// POST /auth/forgot-password  (stub — enviaría email en producción)
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    // Always return 200 to avoid user enumeration
    await prisma.user.findUnique({ where: { email } }); // check exists but don't reveal
    res.json({ message: 'Si el email existe, recibirás instrucciones en breve' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, logout, forgotPassword };
