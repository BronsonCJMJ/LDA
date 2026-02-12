import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, param, query } from 'express-validator';
import multer from 'multer';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { uploadFile, generateSignedUrl } from '../services/storage.js';

const prisma = new PrismaClient();
const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// POST /api/forms/submit — public, submit any form
router.post(
  '/submit',
  upload.single('idDocument'),
  validate([
    body('formType').isIn(['registration', 'protest_appeal', 'club_affiliation', 'contact']),
    body('name').notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
  ]),
  async (req: Request, res: Response, next) => {
    try {
      let idDocumentUrl: string | undefined;
      if (req.file) {
        const result = await uploadFile(req.file, 'registrations');
        idDocumentUrl = result.url;
      }

      // Parse the data field (sent as JSON string from FormData)
      let data = req.body.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch { /* keep as string */ }
      }

      const submission = await prisma.formSubmission.create({
        data: {
          formType: req.body.formType,
          name: req.body.name,
          email: req.body.email,
          data: data || {},
          idDocumentUrl,
          status: 'new',
        },
      });

      res.status(201).json({ success: true, data: { id: submission.id, message: 'Form submitted successfully' } });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/forms/admin/all — admin, list submissions
router.get(
  '/admin/all',
  authenticate,
  validate([
    query('formType').optional().isString(),
    query('status').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  async (req: Request, res: Response, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const where: any = {};
      if (req.query.formType) where.formType = req.query.formType;
      if (req.query.status) where.status = req.query.status;

      const [submissions, total] = await Promise.all([
        prisma.formSubmission.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.formSubmission.count({ where }),
      ]);

      res.json({ success: true, data: { submissions, total, page, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/forms/admin/:id — admin, single submission
router.get('/admin/:id', authenticate, validate([param('id').isUUID()]), async (req: Request, res: Response, next) => {
  try {
    const submission = await prisma.formSubmission.findUnique({ where: { id: req.params.id } });
    if (!submission) throw new AppError('Not found', 404, 'NOT_FOUND');

    const data: any = { ...submission };
    if (submission.idDocumentUrl) {
      data.idDocumentSignedUrl = await generateSignedUrl(submission.idDocumentUrl);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/forms/admin/:id — admin, update status/notes
router.patch(
  '/admin/:id',
  authenticate,
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next) => {
    try {
      const existing = await prisma.formSubmission.findUnique({ where: { id: req.params.id } });
      if (!existing) throw new AppError('Not found', 404, 'NOT_FOUND');

      const data: any = {};
      if (req.body.status) data.status = req.body.status;
      if (req.body.notes !== undefined) data.notes = req.body.notes;

      const submission = await prisma.formSubmission.update({ where: { id: req.params.id }, data });
      res.json({ success: true, data: submission });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/forms/admin/:id — admin
router.delete('/admin/:id', authenticate, validate([param('id').isUUID()]), async (req: Request, res: Response, next) => {
  try {
    await prisma.formSubmission.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
