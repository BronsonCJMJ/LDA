import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create admin account for Des
  const adminPassword = await bcrypt.hash('LDA2026!Admin', 12);
  const admin = await prisma.admin.upsert({
    where: { email: 'labradordarts23@gmail.com' },
    update: {},
    create: {
      email: 'labradordarts23@gmail.com',
      passwordHash: adminPassword,
      name: 'Des Montague',
      role: 'super_admin',
    },
  });
  console.log('Admin created:', admin.email);

  // 2. Seed site settings
  const settings: Record<string, any> = {
    announcement: {
      enabled: true,
      text: '2026 Season Registration Open',
      linkText: 'Register Now',
      linkUrl: '/forms',
    },
    stats: {
      nextTournament: { label: 'Next Tournament', value: 'Mar 12', description: 'Labrador Open — Regional Qualifier' },
      activeMembers: { label: 'Active Members', value: '142', description: 'Registered for 2025–26 season' },
      currentSeason: { label: 'Current Season', value: '2025–26', description: 'Week 14 of regular play' },
    },
    boardMembers: [
      { name: 'Des Montague', title: 'President', initials: 'DM' },
      { name: 'Tony Cullen', title: 'Youth Director', initials: 'TC' },
      { name: 'Tina Chiasson', title: 'Membership Director', initials: 'TC' },
    ],
    heroText: {
      eyebrow: 'Official Association Portal',
      title: 'Labrador Darts Association',
      subtitle: 'The central hub for tournament schedules, league standings, and community news across the Big Land.',
    },
  };

  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) },
    });
  }
  console.log('Site settings seeded');

  // 3. Seed tournaments
  const tournaments = [
    {
      name: 'Labrador Open',
      description: 'Regional Qualifier — NDFC National Ranking Tournament. $5260+ payout, 100% payout.',
      venue: 'Royal Canadian Legion Branch 51',
      location: 'Happy Valley-Goose Bay, NL',
      startDate: new Date('2026-03-12'),
      endDate: new Date('2026-03-14'),
      registrationDeadline: new Date('2026-03-10'),
      status: 'open',
      type: 'regional',
      season: '2025-26',
    },
    {
      name: 'Mixed Doubles Championship',
      description: 'Annual mixed doubles tournament. All registered LDA members welcome.',
      location: 'Happy Valley-Goose Bay, NL',
      startDate: new Date('2026-04-04'),
      status: 'upcoming',
      type: 'regional',
      season: '2025-26',
    },
    {
      name: 'Season Finale',
      description: 'End of season celebration tournament with awards ceremony.',
      location: 'Happy Valley-Goose Bay, NL',
      startDate: new Date('2026-05-20'),
      status: 'upcoming',
      type: 'regional',
      season: '2025-26',
    },
    {
      name: 'Big Land Northern Classic',
      description: 'National Ranking Tournament. $5260+, 100% payout. Mixed Doubles, Men\'s Doubles, Ladies Singles, Mixed Triples, Men\'s Singles, Ladies Doubles.',
      venue: 'Royal Canadian Legion Branch 51',
      location: '172 Hamilton River Road, Happy Valley-Goose Bay, NL A0P 1M0',
      startDate: new Date('2025-10-31'),
      endDate: new Date('2025-11-02'),
      status: 'completed',
      type: 'regional',
      season: '2025-26',
    },
    {
      name: 'Central Zone Shoot',
      description: 'Zone Shoot qualification event. Must hold current LDA membership.',
      location: 'Happy Valley-Goose Bay, NL',
      startDate: new Date('2025-12-21'),
      status: 'completed',
      type: 'zone_shoot',
      season: '2025-26',
    },
  ];

  for (const t of tournaments) {
    await prisma.tournament.create({ data: t });
  }
  console.log('Tournaments seeded');

  // 4. Seed news articles
  const articles = [
    {
      title: 'Winter Regional Results Released',
      body: '<p>Full results from the 2026 Winter Regional are now available. Congratulations to all participants for an excellent weekend of competition.</p>',
      excerpt: 'Full results from the 2026 Winter Regional are now available.',
      tag: 'official',
      isPublished: true,
      publishedAt: new Date('2026-02-24'),
      authorId: admin.id,
    },
    {
      title: 'Roster & Membership Deadline March 1st',
      body: '<p>All players must have current season membership by March 1st to be eligible for the Labrador Open. Contact Tina Chiasson, Membership Director, for details.</p>',
      excerpt: 'All players must have current season membership by March 1st.',
      tag: 'deadline',
      isPublished: true,
      publishedAt: new Date('2026-02-18'),
      authorId: admin.id,
    },
    {
      title: 'NDFC Rule Changes for 2026 Season',
      body: '<p>The National Darts Federation of Canada has announced several rule updates effective this season. Review the updated rulebook on the Forms & Documents page.</p>',
      excerpt: 'NDFC has announced several rule updates effective this season.',
      tag: 'update',
      isPublished: true,
      publishedAt: new Date('2026-02-10'),
      authorId: admin.id,
    },
    {
      title: 'Labrador Open Registration Now Open',
      body: '<p>Registration for the Labrador Open (March 12–14) is now open. This is a Regional Qualifier for NDFC nationals. Visit the Forms page to register or contact Des Montague.</p>',
      excerpt: 'Registration for the Labrador Open is now open.',
      tag: 'event',
      isPublished: true,
      publishedAt: new Date('2026-02-05'),
      authorId: admin.id,
    },
    {
      title: 'Big Land Northern Classic Results',
      body: '<p>The Big Land Northern Classic wrapped up with incredible competition. Full results and DartConnect stats are available on the Tournaments page.</p>',
      excerpt: 'The Big Land Northern Classic wrapped up with incredible competition.',
      tag: 'official',
      isPublished: true,
      publishedAt: new Date('2025-11-03'),
      authorId: admin.id,
    },
    {
      title: '2025-26 Membership Registration Open',
      body: '<p>Registration is now open for the 2025-2026 Labrador Darts Association memberships. Adult membership $60, Youth membership $20. EMT to labradordarts23@gmail.com.</p>',
      excerpt: 'Registration is now open for 2025-2026 LDA memberships.',
      tag: 'official',
      isPublished: true,
      publishedAt: new Date('2025-09-11'),
      authorId: admin.id,
    },
  ];

  for (const a of articles) {
    await prisma.newsArticle.create({ data: a });
  }
  console.log('News articles seeded');

  // 5. Seed Big Land Northern Classic results
  const blnc = await prisma.tournament.findFirst({ where: { name: 'Big Land Northern Classic' } });
  if (blnc) {
    await prisma.tournamentResult.createMany({
      data: [
        // Mixed Doubles
        { tournamentId: blnc.id, category: 'Mixed Doubles', placement: 1, playerNames: 'Philip Matthews & Kelly Matthews' },
        { tournamentId: blnc.id, category: 'Mixed Doubles', placement: 2, playerNames: 'Mark Applin & Tina Chiasson' },
        { tournamentId: blnc.id, category: 'Mixed Doubles', placement: 3, playerNames: 'James Ponniuk & Gaye Coombs' },
        { tournamentId: blnc.id, category: 'Mixed Doubles', placement: 3, playerNames: 'Graham Blake & Charlene Gear' },
        // Mixed Triples
        { tournamentId: blnc.id, category: 'Mixed Triples', placement: 1, playerNames: 'Jacob Taylor, Barry Keough & Mary Pittman' },
        { tournamentId: blnc.id, category: 'Mixed Triples', placement: 2, playerNames: 'Chris Learning, Johnny Burke & Emily Sampson' },
        // Men\'s Doubles
        { tournamentId: blnc.id, category: "Men's Doubles", placement: 1, playerNames: 'Jacob Taylor & Sam Organ' },
        { tournamentId: blnc.id, category: "Men's Doubles", placement: 2, playerNames: 'James Ponniuk & Charlie Chiasson' },
        // Ladies' Singles
        { tournamentId: blnc.id, category: "Ladies' Singles", placement: 1, playerNames: 'Ashley Broomfield' },
        { tournamentId: blnc.id, category: "Ladies' Singles", placement: 2, playerNames: 'Emily Sampson' },
        // Men's Singles
        { tournamentId: blnc.id, category: "Men's Singles", placement: 1, playerNames: 'Jacob Taylor' },
        { tournamentId: blnc.id, category: "Men's Singles", placement: 2, playerNames: 'Kevin Gear' },
        // Ladies' Doubles
        { tournamentId: blnc.id, category: "Ladies' Doubles", placement: 1, playerNames: 'Ashley Broomfield & Kelly Matthews' },
        { tournamentId: blnc.id, category: "Ladies' Doubles", placement: 2, playerNames: 'Sophie Tuglavina & Rylie Pomphrey' },
      ],
    });

    // Seed stats from DartConnect screenshots
    await prisma.tournamentStat.createMany({
      data: [
        // Men's Singles KO
        { tournamentId: blnc.id, category: "Men's Singles KO", statType: 'fewest_501_darts', rank: 1, value: '13 Darts', detail: 'Leg 2', playerNames: 'Jacob Taylor vs. Peter Nuna' },
        { tournamentId: blnc.id, category: "Men's Singles KO", statType: 'fewest_501_darts', rank: 2, value: '14 Darts', detail: 'Leg 1', playerNames: 'Kris Reid vs. Tony Howell' },
        { tournamentId: blnc.id, category: "Men's Singles KO", statType: 'highest_match_avg', rank: 1, value: '93.94', detail: '3 Legs', playerNames: 'Jacob Taylor vs. Dave Kelloway' },
        { tournamentId: blnc.id, category: "Men's Singles KO", statType: 'highest_match_avg', rank: 2, value: '87.38', detail: '5 Legs', playerNames: 'Jacob Taylor vs. Kevin Gear' },
        { tournamentId: blnc.id, category: "Men's Singles KO", statType: 'highest_checkout', rank: 1, value: '130 C/O', detail: '100.20', playerNames: 'Jacob Taylor vs. Charlie Chiasson' },
        { tournamentId: blnc.id, category: "Men's Singles KO", statType: 'highest_checkout', rank: 2, value: '124 C/O', detail: '71.57', playerNames: 'Tony Cullen vs. Kris Reid' },
        // Men's Singles RR
        { tournamentId: blnc.id, category: "Men's Singles RR", statType: 'fewest_501_darts', rank: 1, value: '12 Darts', detail: 'Leg 1', playerNames: 'Jacob Taylor vs. Johnny Burke' },
        { tournamentId: blnc.id, category: "Men's Singles RR", statType: 'highest_match_avg', rank: 1, value: '96.97', detail: '2 Legs', playerNames: 'Jacob Taylor vs. Johnny Burke' },
        { tournamentId: blnc.id, category: "Men's Singles RR", statType: 'highest_checkout', rank: 1, value: '156 C/O', detail: '100.20', playerNames: 'Kevin Gear vs. Glen Noble' },
        // Ladies' Singles KO
        { tournamentId: blnc.id, category: "Ladies' Singles KO", statType: 'fewest_501_darts', rank: 1, value: '17 Darts', detail: 'Leg 1', playerNames: 'Ashley Broomfield vs. Joanne Sampson' },
        { tournamentId: blnc.id, category: "Ladies' Singles KO", statType: 'highest_match_avg', rank: 1, value: '69.91', detail: '4 Legs', playerNames: 'Ashley Broomfield vs. Joanne Sampson' },
        { tournamentId: blnc.id, category: "Ladies' Singles KO", statType: 'highest_checkout', rank: 1, value: '94 C/O', detail: '50.10', playerNames: 'Joanne Sampson vs. Elaine Pearce' },
      ],
    });

    console.log('Tournament results and stats seeded');
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
