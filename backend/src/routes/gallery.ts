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
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// GET /api/gallery — public, albums with cover
router.get('/', async (_req: Request, res: Response, next) => {
  try {
    const albums = await prisma.galleryAlbum.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: 'asc' }, { eventDate: 'desc' }],
      include: { _count: { select: { photos: true } } },
    });

    const resolved = await Promise.all(
      albums.map(async (a) => ({
        ...a,
        coverImageUrl: a.coverImageUrl ? await generateSignedUrl(a.coverImageUrl) : null,
      }))
    );

    res.json({ success: true, data: resolved });
  } catch (error) {
    next(error);
  }
});

// GET /api/gallery/:id — public, album with all photos
router.get('/:id', validate([param('id').isUUID()]), async (req: Request, res: Response, next) => {
  try {
    const album = await prisma.galleryAlbum.findUnique({
      where: { id: req.params.id },
      include: { photos: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!album || !album.isPublished) throw new AppError('Not found', 404, 'NOT_FOUND');

    const photos = await Promise.all(
      album.photos.map(async (p) => ({
        ...p,
        imageUrl: await generateSignedUrl(p.imageUrl),
      }))
    );

    const coverUrl = album.coverImageUrl ? await generateSignedUrl(album.coverImageUrl) : null;

    res.json({ success: true, data: { ...album, coverImageUrl: coverUrl, photos } });
  } catch (error) {
    next(error);
  }
});

// GET /api/gallery/admin/all — admin, all albums
router.get('/admin/all', authenticate, async (_req: Request, res: Response, next) => {
  try {
    const albums = await prisma.galleryAlbum.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { photos: true } } },
    });
    res.json({ success: true, data: albums });
  } catch (error) {
    next(error);
  }
});

// POST /api/gallery — admin, create album
router.post(
  '/',
  authenticate,
  validate([body('title').notEmpty()]),
  async (req: Request, res: Response, next) => {
    try {
      const album = await prisma.galleryAlbum.create({
        data: {
          title: req.body.title,
          description: req.body.description || null,
          eventDate: req.body.eventDate ? new Date(req.body.eventDate) : null,
          season: req.body.season || null,
          isPublished: req.body.isPublished !== false,
        },
      });

      res.status(201).json({ success: true, data: album });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/gallery/:id — admin, update album
router.put('/:id', authenticate, validate([param('id').isUUID()]), async (req: Request, res: Response, next) => {
  try {
    const existing = await prisma.galleryAlbum.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Not found', 404, 'NOT_FOUND');

    const data: any = {};
    if (req.body.title !== undefined) data.title = req.body.title;
    if (req.body.description !== undefined) data.description = req.body.description || null;
    if (req.body.eventDate !== undefined) data.eventDate = req.body.eventDate ? new Date(req.body.eventDate) : null;
    if (req.body.season !== undefined) data.season = req.body.season || null;
    if (req.body.isPublished !== undefined) data.isPublished = Boolean(req.body.isPublished);
    if (req.body.sortOrder !== undefined) data.sortOrder = parseInt(req.body.sortOrder);

    const album = await prisma.galleryAlbum.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: album });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/gallery/:id — admin, delete album + photos
router.delete('/:id', authenticate, validate([param('id').isUUID()]), async (req: Request, res: Response, next) => {
  try {
    const album = await prisma.galleryAlbum.findUnique({
      where: { id: req.params.id },
      include: { photos: true },
    });
    if (!album) throw new AppError('Not found', 404, 'NOT_FOUND');

    // Delete all photo files
    for (const photo of album.photos) {
      await deleteFile(photo.imageUrl);
    }
    if (album.coverImageUrl) await deleteFile(album.coverImageUrl);

    await prisma.galleryAlbum.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    next(error);
  }
});

// POST /api/gallery/:id/photos — admin, upload photos to album
router.post(
  '/:id/photos',
  authenticate,
  upload.array('photos', 20),
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next) => {
    try {
      const album = await prisma.galleryAlbum.findUnique({ where: { id: req.params.id } });
      if (!album) throw new AppError('Album not found', 404, 'NOT_FOUND');

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) throw new AppError('No files uploaded', 400, 'NO_FILES');

      const maxSort = await prisma.galleryPhoto.findFirst({
        where: { albumId: req.params.id },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });
      let sortOrder = (maxSort?.sortOrder ?? -1) + 1;

      const photos = [];
      for (const file of files) {
        const result = await uploadFile(file, `gallery/${req.params.id}`);
        const photo = await prisma.galleryPhoto.create({
          data: {
            albumId: req.params.id,
            imageUrl: result.url,
            caption: null,
            sortOrder: sortOrder++,
          },
        });
        photos.push(photo);
      }

      // Set cover image if album doesn't have one
      if (!album.coverImageUrl && photos.length > 0) {
        await prisma.galleryAlbum.update({
          where: { id: req.params.id },
          data: { coverImageUrl: photos[0].imageUrl },
        });
      }

      res.status(201).json({ success: true, data: photos });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/gallery/:albumId/photos/:photoId — admin
router.delete(
  '/:albumId/photos/:photoId',
  authenticate,
  validate([param('albumId').isUUID(), param('photoId').isUUID()]),
  async (req: Request, res: Response, next) => {
    try {
      const photo = await prisma.galleryPhoto.findUnique({ where: { id: req.params.photoId } });
      if (!photo || photo.albumId !== req.params.albumId) throw new AppError('Not found', 404, 'NOT_FOUND');

      await deleteFile(photo.imageUrl);
      await prisma.galleryPhoto.delete({ where: { id: req.params.photoId } });

      res.json({ success: true, message: 'Deleted' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
