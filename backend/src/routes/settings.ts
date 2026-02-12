import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { authenticate } from '../middleware/auth.js';
import { clearTon80Cache } from '../services/ton80Api.js';

const prisma = new PrismaClient();
const router = Router();

// Keys that contain secrets — never expose publicly
const SENSITIVE_KEYS = ['ton80'];

// GET /api/settings — public (sensitive keys stripped)
router.get('/', async (_req: Request, res: Response, next) => {
  try {
    const settings = await prisma.siteSetting.findMany();
    const map: Record<string, any> = {};
    for (const s of settings) {
      if (SENSITIVE_KEYS.includes(s.key)) continue;
      try { map[s.key] = JSON.parse(s.value); } catch { map[s.key] = s.value; }
    }
    res.json({ success: true, data: map });
  } catch (error) {
    next(error);
  }
});

// GET /api/settings/all — admin only (includes sensitive, API key masked)
router.get('/all', authenticate, async (_req: Request, res: Response, next) => {
  try {
    const settings = await prisma.siteSetting.findMany();
    const map: Record<string, any> = {};
    for (const s of settings) {
      try { map[s.key] = JSON.parse(s.value); } catch { map[s.key] = s.value; }
    }
    // Mask the API key for display
    if (map.ton80?.apiKey) {
      const key = map.ton80.apiKey;
      map.ton80 = {
        ...map.ton80,
        apiKey: key.length > 8 ? key.slice(0, 6) + '...' + key.slice(-4) : '••••••••',
      };
    }
    res.json({ success: true, data: map });
  } catch (error) {
    next(error);
  }
});

// PUT /api/settings — admin, batch update
router.put('/', authenticate, async (req: Request, res: Response, next) => {
  try {
    const entries = Object.entries(req.body) as [string, any][];

    for (const [key, value] of entries) {
      // For ton80 settings, merge with existing to preserve apiKey when not sent
      if (key === 'ton80' && typeof value === 'object') {
        const existing = await prisma.siteSetting.findUnique({ where: { key: 'ton80' } });
        let merged = value;
        if (existing) {
          try {
            const prev = JSON.parse(existing.value);
            merged = { ...prev, ...value };
            // If apiKey wasn't included in the update, keep the old one
            if (!value.apiKey && prev.apiKey) merged.apiKey = prev.apiKey;
          } catch { /* use value as-is */ }
        }
        await prisma.siteSetting.upsert({
          where: { key },
          update: { value: JSON.stringify(merged) },
          create: { key, value: JSON.stringify(merged) },
        });
        continue;
      }

      const strValue = typeof value === 'string' ? value : JSON.stringify(value);
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value: strValue },
        create: { key, value: strValue },
      });
    }

    // Clear Ton80 API cache if ton80 settings were updated
    if (entries.some(([key]) => key === 'ton80')) {
      clearTon80Cache();
    }

    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    next(error);
  }
});

// POST /api/settings/test-ton80 — admin, test Ton80 API connection
router.post('/test-ton80', authenticate, async (req: Request, res: Response, next) => {
  try {
    const { apiUrl, apiKey, orgSlug } = req.body;
    if (!apiUrl) {
      return res.status(400).json({ success: false, error: { message: 'API URL is required' } });
    }

    const headers: Record<string, string> = {};
    if (apiKey) headers['X-API-Key'] = apiKey;

    // Test basic connectivity by fetching org if slug provided, otherwise just hit a known endpoint
    const testUrl = orgSlug
      ? `${apiUrl}/organizations/${orgSlug}`
      : `${apiUrl}/events`;

    const response = await axios.get(testUrl, { headers, timeout: 10000 });

    if (response.data?.success) {
      const detail = orgSlug && response.data.data?.name
        ? ` — Found organization: ${response.data.data.name}`
        : '';
      res.json({ success: true, message: `Connected to Ton80 successfully${detail}` });
    } else {
      res.json({ success: false, error: { message: 'Unexpected response from Ton80 API' } });
    }
  } catch (err: any) {
    const status = err?.response?.status;
    const msg = status === 401
      ? 'Invalid API key'
      : status === 404
      ? 'Organization not found — check the slug'
      : err?.code === 'ECONNREFUSED'
      ? 'Cannot reach Ton80 API — check the URL'
      : `Connection failed: ${err?.message || 'Unknown error'}`;
    res.status(400).json({ success: false, error: { message: msg } });
  }
});

export default router;
