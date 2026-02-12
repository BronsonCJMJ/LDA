import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Delete BLNC and Zone Shoot albums (spreadsheet screenshots, not real photos)
  const albums = await prisma.galleryAlbum.findMany({
    where: { title: { in: ['Big Land Northern Classic 2025', 'Central Zone Shoot 2025'] } },
    include: { photos: true },
  });

  for (const album of albums) {
    await prisma.galleryPhoto.deleteMany({ where: { albumId: album.id } });
    await prisma.galleryAlbum.delete({ where: { id: album.id } });
    console.log(`Deleted album: ${album.title} (${album.photos.length} photos)`);
  }

  // Keep Team Labrador album
  const remaining = await prisma.galleryAlbum.findMany({ include: { _count: { select: { photos: true } } } });
  console.log('Remaining albums:', remaining.map(a => `${a.title} (${a._count.photos} photos)`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
