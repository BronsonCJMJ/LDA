import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding gallery and documents...');

  // ---- GALLERY ----

  // Album 1: Big Land Northern Classic
  const blnc = await prisma.galleryAlbum.create({
    data: {
      title: 'Big Land Northern Classic 2025',
      description: 'Photos from the Big Land Northern Classic, October 31 - November 2, 2025. Royal Canadian Legion Branch 51, Happy Valley-Goose Bay.',
      eventDate: new Date('2025-11-01'),
      season: '2025-26',
      coverImageUrl: 'gallery/blnc/625337269.jpg',
      isPublished: true,
      sortOrder: 0,
    },
  });

  const blncPhotos = [
    '625337269', '625357155', '625445987', '624381015', '624569594',
    '624542646', '623302779', '624541424', '623813434', '623366058', '624114760',
  ];

  for (let i = 0; i < blncPhotos.length; i++) {
    await prisma.galleryPhoto.create({
      data: {
        albumId: blnc.id,
        imageUrl: `gallery/blnc/${blncPhotos[i]}.jpg`,
        sortOrder: i,
      },
    });
  }
  console.log(`Created album "${blnc.title}" with ${blncPhotos.length} photos`);

  // Album 2: Central Zone Shoot
  const zoneShoot = await prisma.galleryAlbum.create({
    data: {
      title: 'Central Zone Shoot 2025',
      description: 'Photos from the Central Zone Shoot qualification event, December 2025.',
      eventDate: new Date('2025-12-21'),
      season: '2025-26',
      coverImageUrl: 'gallery/zone-shoot/619112473.jpg',
      isPublished: true,
      sortOrder: 1,
    },
  });

  const zonePhotos = ['619112473', '616248713', '615875950', '613907471', '605714487', '600276135'];

  for (let i = 0; i < zonePhotos.length; i++) {
    await prisma.galleryPhoto.create({
      data: {
        albumId: zoneShoot.id,
        imageUrl: `gallery/zone-shoot/${zonePhotos[i]}.jpg`,
        sortOrder: i,
      },
    });
  }
  console.log(`Created album "${zoneShoot.title}" with ${zonePhotos.length} photos`);

  // Album 3: Team Labrador
  const teamAlbum = await prisma.galleryAlbum.create({
    data: {
      title: 'Team Labrador',
      description: 'Team Labrador representing the Big Land at provincial and national competitions.',
      season: '2025-26',
      coverImageUrl: 'gallery/team-labrador.jpg',
      isPublished: true,
      sortOrder: 2,
    },
  });

  await prisma.galleryPhoto.create({
    data: {
      albumId: teamAlbum.id,
      imageUrl: 'gallery/team-labrador.jpg',
      sortOrder: 0,
    },
  });
  console.log(`Created album "${teamAlbum.title}"`);

  // ---- DOCUMENTS ----
  const documents = [
    {
      title: 'NDFC Official Rules (Revised Oct 2023)',
      description: 'Complete official rules of play for NDFC-sanctioned tournaments and events.',
      fileUrl: 'documents/ndfc-official-rules-2023.pdf',
      fileType: 'pdf',
      fileSize: 604774,
      category: 'rules',
      sortOrder: 0,
    },
    {
      title: 'NDFC Regulations (Oct 2024)',
      description: 'Current NDFC regulations governing tournament operations, membership, and organizational procedures.',
      fileUrl: 'documents/ndfc-regulations-2024.pdf',
      fileType: 'pdf',
      fileSize: 1258291,
      category: 'rules',
      sortOrder: 1,
    },
    {
      title: 'NDFC Constitution (Revised 2019)',
      description: 'The constitution of the National Darts Federation of Canada.',
      fileUrl: 'documents/ndfc-constitution-2019.pdf',
      fileType: 'pdf',
      fileSize: 712090,
      category: 'bylaws',
      sortOrder: 2,
    },
    {
      title: 'NDFC Adult National Ranking System 2026',
      description: 'Ranking system and point allocation for NDFC adult national rankings.',
      fileUrl: 'documents/ndfc-adult-ranking-2026.pdf',
      fileType: 'pdf',
      fileSize: 918118,
      category: 'rules',
      sortOrder: 3,
    },
    {
      title: 'NDFC Youth National Ranking System 2025',
      description: 'Ranking system and point allocation for NDFC youth national rankings.',
      fileUrl: 'documents/ndfc-youth-ranking-2025.pdf',
      fileType: 'pdf',
      fileSize: 462233,
      category: 'rules',
      sortOrder: 4,
    },
    {
      title: 'NDFC Tiebreaker Rules',
      description: 'Official tiebreaker procedures for NDFC tournaments.',
      fileUrl: 'documents/ndfc-tiebreaker-rules.pdf',
      fileType: 'pdf',
      fileSize: 284365,
      category: 'rules',
      sortOrder: 5,
    },
    {
      title: 'NDFC Disciplinary Procedures',
      description: 'Procedures for handling disciplinary matters, protests, and appeals.',
      fileUrl: 'documents/ndfc-disciplinary-procedures.pdf',
      fileType: 'pdf',
      fileSize: 24678,
      category: 'rules',
      sortOrder: 6,
    },
    {
      title: 'NDFC Conflict of Interest Policy',
      description: 'Policy governing conflicts of interest for NDFC officials and members.',
      fileUrl: 'documents/ndfc-conflict-of-interest.pdf',
      fileType: 'pdf',
      fileSize: 23040,
      category: 'bylaws',
      sortOrder: 7,
    },
    {
      title: 'NDFC Transgender Athlete Policy',
      description: 'Policy for transgender athlete participation in NDFC events.',
      fileUrl: 'documents/ndfc-transgender-policy.pdf',
      fileType: 'pdf',
      fileSize: 83149,
      category: 'bylaws',
      sortOrder: 8,
    },
    {
      title: 'NDFC Master List of Deadlines 2024-2025',
      description: 'All key dates and deadlines for the 2024-2025 NDFC season.',
      fileUrl: 'documents/ndfc-deadlines-2024-2025.pdf',
      fileType: 'pdf',
      fileSize: 573952,
      category: 'general',
      sortOrder: 9,
    },
    {
      title: 'NDFC Nomination & Election of Officers',
      description: 'Procedures for nominating and electing NDFC officers.',
      fileUrl: 'documents/ndfc-nomination-election.pdf',
      fileType: 'pdf',
      fileSize: 31130,
      category: 'bylaws',
      sortOrder: 10,
    },
  ];

  for (const doc of documents) {
    await prisma.document.create({ data: { ...doc, isPublished: true } });
  }
  console.log(`Created ${documents.length} documents`);

  console.log('Content seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
