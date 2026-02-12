import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, param } from 'express-validator';
import multer from 'multer';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { uploadFile, generateSignedUrl, deleteFile } from '../services/storage.js';

const prisma = new PrismaClient();
const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// GET /api/documents — public
router.get('/', async (_req: Request, res: Response, next) => {
  try {
    const documents = await prisma.document.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    res.json({ success: true, data: documents });
  } catch (error) {
    next(error);
  }
});

// GET /api/documents/:id/download — public, generates signed download URL
router.get('/:id/download', validate([param('id').isUUID()]), async (req: Request, res: Response, next) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc || !doc.isPublished) throw new AppError('Not found', 404, 'NOT_FOUND');

    const downloadUrl = await generateSignedUrl(doc.fileUrl);
    res.json({ success: true, data: { downloadUrl } });
  } catch (error) {
    next(error);
  }
});

// GET /api/documents/admin/all — admin
router.get('/admin/all', authenticate, async (_req: Request, res: Response, next) => {
  try {
    const documents = await prisma.document.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
    res.json({ success: true, data: documents });
  } catch (error) {
    next(error);
  }
});

// POST /api/documents — admin, upload document
router.post(
  '/',
  authenticate,
  upload.single('file'),
  validate([body('title').notEmpty()]),
  async (req: Request, res: Response, next) => {
    try {
      if (!req.file) throw new AppError('File required', 400, 'NO_FILE');

      const result = await uploadFile(req.file, 'documents');
      const ext = req.file.originalname.split('.').pop()?.toLowerCase() || 'pdf';

      const doc = await prisma.document.create({
        data: {
          title: req.body.title,
          description: req.body.description || null,
          fileUrl: result.url,
          fileType: ext,
          fileSize: req.file.size,
          category: req.body.category || 'general',
          isPublished: req.body.isPublished !== 'false',
        },
      });

      res.status(201).json({ success: true, data: doc });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/documents/:id — admin
router.put(
  '/:id',
  authenticate,
  upload.single('file'),
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next) => {
    try {
      const existing = await prisma.document.findUnique({ where: { id: req.params.id } });
      if (!existing) throw new AppError('Not found', 404, 'NOT_FOUND');

      const data: any = {};
      if (req.body.title) data.title = req.body.title;
      if (req.body.description !== undefined) data.description = req.body.description || null;
      if (req.body.category) data.category = req.body.category;
      if (req.body.isPublished !== undefined) data.isPublished = req.body.isPublished !== 'false';
      if (req.body.sortOrder !== undefined) data.sortOrder = parseInt(req.body.sortOrder);

      if (req.file) {
        await deleteFile(existing.fileUrl);
        const result = await uploadFile(req.file, 'documents');
        data.fileUrl = result.url;
        data.fileType = req.file.originalname.split('.').pop()?.toLowerCase() || 'pdf';
        data.fileSize = req.file.size;
      }

      const doc = await prisma.document.update({ where: { id: req.params.id }, data });
      res.json({ success: true, data: doc });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/documents/:id — admin
router.delete('/:id', authenticate, validate([param('id').isUUID()]), async (req: Request, res: Response, next) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc) throw new AppError('Not found', 404, 'NOT_FOUND');
    await deleteFile(doc.fileUrl);
    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
