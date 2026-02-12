import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, param, query } from 'express-validator';
import multer from 'multer';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { uploadFile, generateSignedUrl, deleteFile } from '../services/storage.js';

const prisma = new PrismaClient();
const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/news — public, published articles
router.get(
  '/',
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('tag').optional().isString(),
  ]),
  async (req: Request, res: Response, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const tag = req.query.tag as string | undefined;

      const where: any = { isPublished: true };
      if (tag) where.tag = tag;

      const [articles, total] = await Promise.all([
        prisma.newsArticle.findMany({
          where,
          orderBy: { publishedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: { author: { select: { name: true } } },
        }),
        prisma.newsArticle.count({ where }),
      ]);

      const resolved = await Promise.all(
        articles.map(async (a) => ({
          ...a,
          imageUrl: a.imageUrl ? await generateSignedUrl(a.imageUrl) : null,
        }))
      );

      res.json({ success: true, data: { articles: resolved, total, page, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/news/:id — public, single article
router.get('/:id', validate([param('id').isUUID()]), async (req: Request, res: Response, next) => {
  try {
    const article = await prisma.newsArticle.findUnique({
      where: { id: req.params.id },
      include: { author: { select: { name: true } } },
    });
    if (!article || !article.isPublished) throw new AppError('Article not found', 404, 'NOT_FOUND');

    if (article.imageUrl) article.imageUrl = await generateSignedUrl(article.imageUrl);
    res.json({ success: true, data: article });
  } catch (error) {
    next(error);
  }
});

// GET /api/news/admin/all — admin, all articles including drafts
router.get('/admin/all', authenticate, async (req: Request, res: Response, next) => {
  try {
    const articles = await prisma.newsArticle.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true } } },
    });
    res.json({ success: true, data: articles });
  } catch (error) {
    next(error);
  }
});

// POST /api/news — admin, create article
router.post(
  '/',
  authenticate,
  upload.single('image'),
  validate([
    body('title').notEmpty().withMessage('Title required'),
    body('body').notEmpty().withMessage('Body required'),
    body('tag').optional().isIn(['official', 'deadline', 'update', 'event']),
    body('isPublished').optional().isBoolean(),
  ]),
  async (req: Request, res: Response, next) => {
    try {
      let imageUrl: string | undefined;
      if (req.file) {
        const result = await uploadFile(req.file, 'news');
        imageUrl = result.url;
      }

      const isPublished = req.body.isPublished === 'true' || req.body.isPublished === true;

      const article = await prisma.newsArticle.create({
        data: {
          title: req.body.title,
          body: req.body.body,
          excerpt: req.body.excerpt || null,
          tag: req.body.tag || 'update',
          imageUrl,
          isPublished,
          publishedAt: isPublished ? new Date() : null,
          authorId: req.user!.userId,
        },
      });

      res.status(201).json({ success: true, data: article });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/news/:id — admin, update article
router.put(
  '/:id',
  authenticate,
  upload.single('image'),
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next) => {
    try {
      const existing = await prisma.newsArticle.findUnique({ where: { id: req.params.id } });
      if (!existing) throw new AppError('Not found', 404, 'NOT_FOUND');

      let imageUrl = existing.imageUrl;
      if (req.file) {
        if (existing.imageUrl) await deleteFile(existing.imageUrl);
        const result = await uploadFile(req.file, 'news');
        imageUrl = result.url;
      }

      const isPublished = req.body.isPublished === 'true' || req.body.isPublished === true;
      const wasPublished = existing.isPublished;

      const article = await prisma.newsArticle.update({
        where: { id: req.params.id },
        data: {
          ...(req.body.title && { title: req.body.title }),
          ...(req.body.body && { body: req.body.body }),
          ...(req.body.excerpt !== undefined && { excerpt: req.body.excerpt || null }),
          ...(req.body.tag && { tag: req.body.tag }),
          imageUrl,
          isPublished,
          publishedAt: isPublished && !wasPublished ? new Date() : existing.publishedAt,
        },
      });

      res.json({ success: true, data: article });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/news/:id — admin
router.delete('/:id', authenticate, validate([param('id').isUUID()]), async (req: Request, res: Response, next) => {
  try {
    const article = await prisma.newsArticle.findUnique({ where: { id: req.params.id } });
    if (!article) throw new AppError('Not found', 404, 'NOT_FOUND');

    if (article.imageUrl) await deleteFile(article.imageUrl);
    await prisma.newsArticle.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
