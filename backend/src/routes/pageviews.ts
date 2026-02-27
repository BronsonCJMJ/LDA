import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

// POST / — record a page view (public)
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { path } = req.body;
    if (!path || typeof path !== 'string' || !path.startsWith('/') || path.length > 200) {
      res.json({ success: true });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.pageView.upsert({
      where: { path_date: { path, date: today } },
      update: { count: { increment: 1 } },
      create: { path, date: today, count: 1 },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// GET /total — total site views (public)
router.get('/total', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await prisma.pageView.aggregate({ _sum: { count: true } });
    res.json({ success: true, data: { total: result._sum.count || 0 } });
  } catch (error) {
    next(error);
  }
});

// GET /stats — analytics data (admin only)
router.get('/stats', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(todayStart);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const [totalResult, todayResult, weekResult, monthResult, topPages, dailyTrend] = await Promise.all([
      prisma.pageView.aggregate({ _sum: { count: true } }),
      prisma.pageView.aggregate({ _sum: { count: true }, where: { date: { gte: todayStart } } }),
      prisma.pageView.aggregate({ _sum: { count: true }, where: { date: { gte: weekAgo } } }),
      prisma.pageView.aggregate({ _sum: { count: true }, where: { date: { gte: monthAgo } } }),
      prisma.pageView.groupBy({
        by: ['path'],
        _sum: { count: true },
        orderBy: { _sum: { count: 'desc' } },
        take: 10,
      }),
      prisma.pageView.groupBy({
        by: ['date'],
        _sum: { count: true },
        where: { date: { gte: monthAgo } },
        orderBy: { date: 'asc' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalViews: totalResult._sum.count || 0,
        todayViews: todayResult._sum.count || 0,
        weekViews: weekResult._sum.count || 0,
        monthViews: monthResult._sum.count || 0,
        topPages: topPages.map((p) => ({ path: p.path, views: p._sum.count || 0 })),
        dailyTrend: dailyTrend.map((d) => ({ date: d.date, views: d._sum.count || 0 })),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
