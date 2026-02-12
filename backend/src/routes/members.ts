import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();
const router = Router();

// GET /api/members — public roster (limited fields)
router.get(
  '/',
  validate([
    query('season').optional().isString(),
    query('search').optional().isString(),
  ]),
  async (req: Request, res: Response, next) => {
    try {
      const where: any = { membershipStatus: 'active' };
      if (req.query.season) where.season = req.query.season;
      if (req.query.search) {
        where.OR = [
          { firstName: { contains: req.query.search as string, mode: 'insensitive' } },
          { lastName: { contains: req.query.search as string, mode: 'insensitive' } },
        ];
      }

      const members = await prisma.member.findMany({
        where,
        orderBy: { lastName: 'asc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          zone: true,
          membershipType: true,
          tournamentAssignment: true,
          qualifiedProvincials: true,
          season: true,
        },
      });

      res.json({ success: true, data: members });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/members/admin/all — admin, full details
router.get('/admin/all', authenticate, async (req: Request, res: Response, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const search = req.query.search as string | undefined;
    const season = req.query.season as string | undefined;

    const where: any = {};
    if (season) where.season = season;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        orderBy: { lastName: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.member.count({ where }),
    ]);

    res.json({ success: true, data: { members, total, page, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
});

// POST /api/members — admin
router.post(
  '/',
  authenticate,
  validate([
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
  ]),
  async (req: Request, res: Response, next) => {
    try {
      const member = await prisma.member.create({
        data: {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email || null,
          phone: req.body.phone || null,
          dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null,
          sex: req.body.sex || null,
          mailingAddress: req.body.mailingAddress || null,
          mcpNumber: req.body.mcpNumber || null,
          membershipStatus: req.body.membershipStatus || 'pending',
          membershipPaid: req.body.membershipPaid || false,
          membershipType: req.body.membershipType || 'adult',
          zone: req.body.zone || null,
          tournamentAssignment: req.body.tournamentAssignment || null,
          qualifiedProvincials: req.body.qualifiedProvincials || false,
          season: req.body.season || null,
          registrationDate: req.body.registrationDate ? new Date(req.body.registrationDate) : new Date(),
          notes: req.body.notes || null,
        },
      });

      res.status(201).json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/members/:id — admin
router.put('/:id', authenticate, validate([param('id').isUUID()]), async (req: Request, res: Response, next) => {
  try {
    const existing = await prisma.member.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Not found', 404, 'NOT_FOUND');

    const data: any = {};
    const stringFields = ['firstName', 'lastName', 'email', 'phone', 'sex', 'mailingAddress', 'mcpNumber', 'membershipStatus', 'membershipType', 'zone', 'tournamentAssignment', 'season', 'notes'];
    stringFields.forEach((f) => { if (req.body[f] !== undefined) data[f] = req.body[f] || null; });

    if (req.body.dateOfBirth !== undefined) data.dateOfBirth = req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null;
    if (req.body.registrationDate !== undefined) data.registrationDate = req.body.registrationDate ? new Date(req.body.registrationDate) : null;
    if (req.body.membershipPaid !== undefined) data.membershipPaid = Boolean(req.body.membershipPaid);
    if (req.body.qualifiedProvincials !== undefined) data.qualifiedProvincials = Boolean(req.body.qualifiedProvincials);

    const member = await prisma.member.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/members/:id — admin
router.delete('/:id', authenticate, validate([param('id').isUUID()]), async (req: Request, res: Response, next) => {
  try {
    await prisma.member.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    next(error);
  }
});

// POST /api/members/import — admin, CSV import
router.post('/import', authenticate, async (req: Request, res: Response, next) => {
  try {
    const { members } = req.body;
    if (!Array.isArray(members)) throw new AppError('Members array required', 400, 'VALIDATION_ERROR');

    const created = await prisma.member.createMany({
      data: members.map((m: any) => ({
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email || null,
        phone: m.phone || null,
        dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth) : null,
        sex: m.sex || null,
        mailingAddress: m.mailingAddress || null,
        membershipStatus: m.membershipStatus || 'active',
        membershipPaid: m.membershipPaid ?? true,
        membershipType: m.membershipType || 'adult',
        zone: m.zone || null,
        tournamentAssignment: m.tournamentAssignment || null,
        qualifiedProvincials: m.qualifiedProvincials || false,
        season: m.season || null,
        registrationDate: m.registrationDate ? new Date(m.registrationDate) : new Date(),
      })),
      skipDuplicates: true,
    });

    res.json({ success: true, data: { count: created.count } });
  } catch (error) {
    next(error);
  }
});

// ─── Ton80 Integration ───

// POST /api/members/:id/link-ton80 — Link member to Ton80 player profile
router.post(
  '/:id/link-ton80',
  authenticate,
  validate([
    param('id').isUUID(),
    body('ton80Id').notEmpty().withMessage('Ton80 Player ID is required'),
  ]),
  async (req: Request, res: Response, next) => {
    try {
      const member = await prisma.member.findUnique({ where: { id: req.params.id } });
      if (!member) throw new AppError('Member not found', 404, 'NOT_FOUND');

      // Verify the ton80Id exists by calling Ton80 public API
      const { lookupTon80Player } = await import('../services/ton80Api.js');
      let player;
      try {
        player = await lookupTon80Player(req.body.ton80Id);
      } catch {
        throw new AppError('Could not verify Ton80 player. Check the ID and try again.', 400, 'TON80_LOOKUP_FAILED');
      }

      if (!player) {
        throw new AppError('No Ton80 player found with that ID', 404, 'TON80_PLAYER_NOT_FOUND');
      }

      const updated = await prisma.member.update({
        where: { id: req.params.id },
        data: { ton80PlayerId: req.body.ton80Id },
      });

      res.json({
        success: true,
        data: updated,
        ton80Player: { firstName: player.firstName, lastName: player.lastName, ton80Id: player.ton80Id },
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/members/:id/link-ton80 — Unlink member from Ton80
router.delete(
  '/:id/link-ton80',
  authenticate,
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next) => {
    try {
      const updated = await prisma.member.update({
        where: { id: req.params.id },
        data: { ton80PlayerId: null },
      });
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/members/:id/ton80-stats — Get Ton80 stats for a linked member (admin)
router.get(
  '/:id/ton80-stats',
  authenticate,
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next) => {
    try {
      const member = await prisma.member.findUnique({ where: { id: req.params.id } });
      if (!member || !member.ton80PlayerId) {
        throw new AppError('Member not linked to Ton80', 404, 'NOT_LINKED');
      }

      const { getTon80PlayerStats, lookupTon80Player } = await import('../services/ton80Api.js');
      const [player, stats] = await Promise.all([
        lookupTon80Player(member.ton80PlayerId).catch(() => null),
        getTon80PlayerStats(member.ton80PlayerId).catch(() => null),
      ]);

      res.json({ success: true, data: { player, stats } });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/members/:id/public-stats — Public endpoint: member info + Ton80 stats if linked
router.get(
  '/:id/public-stats',
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next) => {
    try {
      const member = await prisma.member.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          zone: true,
          membershipType: true,
          tournamentAssignment: true,
          qualifiedProvincials: true,
          season: true,
          ton80PlayerId: true,
        },
      });

      if (!member) throw new AppError('Member not found', 404, 'NOT_FOUND');

      let ton80Stats = null;
      if (member.ton80PlayerId) {
        try {
          const { getTon80PlayerStats, lookupTon80Player } = await import('../services/ton80Api.js');
          const [player, stats] = await Promise.all([
            lookupTon80Player(member.ton80PlayerId),
            getTon80PlayerStats(member.ton80PlayerId),
          ]);
          ton80Stats = { player, stats };
        } catch {
          // Ton80 API unavailable — graceful fallback
        }
      }

      res.json({ success: true, data: { member, ton80Stats } });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
