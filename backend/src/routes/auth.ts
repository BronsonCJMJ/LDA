import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

const prisma = new PrismaClient();
const router = Router();

// POST /api/auth/login
router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ]),
  async (req: Request, res: Response, next) => {
    try {
      const { email, password } = req.body;

      const admin = await prisma.admin.findUnique({ where: { email } });
      if (!admin) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
      if (!admin.isActive) throw new AppError('Account disabled', 403, 'ACCOUNT_DISABLED');

      const valid = await bcrypt.compare(password, admin.passwordHash);
      if (!valid) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

      await prisma.admin.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      });

      const payload = { userId: admin.id, email: admin.email, role: admin.role };
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction(),
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          accessToken,
          admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new AppError('No refresh token', 401, 'NO_TOKEN');

    const decoded = verifyRefreshToken(token);
    const admin = await prisma.admin.findUnique({ where: { id: decoded.userId } });
    if (!admin || !admin.isActive) throw new AppError('Invalid session', 401, 'INVALID_SESSION');

    const payload = { userId: admin.id, email: admin.email, role: admin.role };
    const accessToken = generateAccessToken(payload);

    res.json({ success: true, data: { accessToken } });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response, next) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, role: true, lastLoginAt: true },
    });
    if (!admin) throw new AppError('Not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: admin });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  res.json({ success: true });
});

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export default router;
