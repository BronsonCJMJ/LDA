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

// GET /api/tournaments — public
router.get(
  '/',
  validate([
    query('season').optional().isString(),
    query('status').optional().isString(),
  ]),
  async (req: Request, res: Response, next) => {
    try {
      const where: any = {};
      if (req.query.season) where.season = req.query.season;
      if (req.query.status) where.status = req.query.status;

      const tournaments = await prisma.tournament.findMany({
        where,
        orderBy: { startDate: 'asc' },
        include: { _count: { select: { results: true, stats: true } } },
      });

      const resolved = await Promise.all(
        tournaments.map(async (t) => ({
          ...t,
          flyerImageUrl: t.flyerImageUrl ? await generateSignedUrl(t.flyerImageUrl) : null,
        }))
      );

      res.json({ success: true, data: resolved });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/tournaments/:id — public, with results and stats
router.get('/:id', validate([param('id').isUUID()]), async (req: Request, res: Response, next) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: {
        results: { orderBy: [{ category: 'asc' }, { placement: 'asc' }] },
        stats: { orderBy: [{ category: 'asc' }, { statType: 'asc' }, { rank: 'asc' }] },
      },
    });
    if (!tournament) throw new AppError('Not found', 404, 'NOT_FOUND');

    if (tournament.flyerImageUrl) {
      tournament.flyerImageUrl = await generateSignedUrl(tournament.flyerImageUrl);
    }

    res.json({ success: true, data: tournament });
  } catch (error) {
    next(error);
  }
});

// POST /api/tournaments — admin
router.post(
  '/',
  authenticate,
  upload.single('flyer'),
  validate([
    body('name').notEmpty(),
    body('startDate').isISO8601(),
  ]),
  async (req: Request, res: Response, next) => {
    try {
      let flyerImageUrl: string | undefined;
      if (req.file) {
        const result = await uploadFile(req.file, 'tournaments');
        flyerImageUrl = result.url;
      }

      const tournament = await prisma.tournament.create({
        data: {
          name: req.body.name,
          description: req.body.description || null,
          venue: req.body.venue || null,
          location: req.body.location || null,
          startDate: new Date(req.body.startDate),
          endDate: req.body.endDate ? new Date(req.body.endDate) : null,
          registrationDeadline: req.body.registrationDeadline ? new Date(req.body.registrationDeadline) : null,
          registrationFee: req.body.registrationFee ? parseFloat(req.body.registrationFee) : null,
          entryFees: req.body.entryFees ? JSON.parse(req.body.entryFees) : null,
          payoutStructure: req.body.payoutStructure ? JSON.parse(req.body.payoutStructure) : null,
          status: req.body.status || 'upcoming',
          type: req.body.type || null,
          flyerImageUrl,
          season: req.body.season || null,
        },
      });

      res.status(201).json({ success: true, data: tournament });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/tournaments/:id — admin
router.put(
  '/:id',
  authenticate,
  upload.single('flyer'),
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next) => {
    try {
      const existing = await prisma.tournament.findUnique({ where: { id: req.params.id } });
      if (!existing) throw new AppError('Not found', 404, 'NOT_FOUND');

      let flyerImageUrl = existing.flyerImageUrl;
      if (req.file) {
        if (existing.flyerImageUrl) await deleteFile(existing.flyerImageUrl);
        const result = await uploadFile(req.file, 'tournaments');
        flyerImageUrl = result.url;
      }

      const data: any = { flyerImageUrl };
      const fields = ['name', 'description', 'venue', 'location', 'status', 'type', 'season'];
      fields.forEach((f) => { if (req.body[f] !== undefined) data[f] = req.body[f] || null; });

      if (req.body.startDate) data.startDate = new Date(req.body.startDate);
      if (req.body.endDate) data.endDate = new Date(req.body.endDate);
      if (req.body.registrationDeadline) data.registrationDeadline = new Date(req.body.registrationDeadline);
      if (req.body.registrationFee) data.registrationFee = parseFloat(req.body.registrationFee);
      if (req.body.entryFees) data.entryFees = JSON.parse(req.body.entryFees);
      if (req.body.payoutStructure) data.payoutStructure = JSON.parse(req.body.payoutStructure);

      const tournament = await prisma.tournament.update({ where: { id: req.params.id }, data });
      res.json({ success: true, data: tournament });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/tournaments/:id — admin
router.delete('/:id', authenticate, validate([param('id').isUUID()]), async (req: Request, res: Response, next) => {
  try {
    const tournament = await prisma.tournament.findUnique({ where: { id: req.params.id } });
    if (!tournament) throw new AppError('Not found', 404, 'NOT_FOUND');
    if (tournament.flyerImageUrl) await deleteFile(tournament.flyerImageUrl);
    await prisma.tournament.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    next(error);
  }
});

// POST /api/tournaments/:id/results — admin, batch upsert results
router.post(
  '/:id/results',
  authenticate,
  validate([
    param('id').isUUID(),
    body('results').isArray(),
    body('results.*.category').notEmpty(),
    body('results.*.placement').isInt({ min: 1 }),
    body('results.*.playerNames').notEmpty(),
  ]),
  async (req: Request, res: Response, next) => {
    try {
      const tournament = await prisma.tournament.findUnique({ where: { id: req.params.id } });
      if (!tournament) throw new AppError('Not found', 404, 'NOT_FOUND');

      // Delete existing results and replace
      await prisma.tournamentResult.deleteMany({ where: { tournamentId: req.params.id } });

      const results = await prisma.tournamentResult.createMany({
        data: req.body.results.map((r: any) => ({
          tournamentId: req.params.id,
          category: r.category,
          placement: r.placement,
          playerNames: r.playerNames,
        })),
      });

      res.json({ success: true, data: { count: results.count } });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/tournaments/:id/stats — admin, batch upsert stats
router.post(
  '/:id/stats',
  authenticate,
  validate([
    param('id').isUUID(),
    body('stats').isArray(),
  ]),
  async (req: Request, res: Response, next) => {
    try {
      const tournament = await prisma.tournament.findUnique({ where: { id: req.params.id } });
      if (!tournament) throw new AppError('Not found', 404, 'NOT_FOUND');

      await prisma.tournamentStat.deleteMany({ where: { tournamentId: req.params.id } });

      const stats = await prisma.tournamentStat.createMany({
        data: req.body.stats.map((s: any) => ({
          tournamentId: req.params.id,
          category: s.category,
          statType: s.statType,
          rank: s.rank,
          value: s.value,
          detail: s.detail || null,
          playerNames: s.playerNames,
        })),
      });

      res.json({ success: true, data: { count: stats.count } });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
