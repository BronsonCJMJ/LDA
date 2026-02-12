import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.newsArticle.findMany({ orderBy: { publishedAt: 'desc' } });

  const updates: Record<string, string> = {
    'Winter Regional Results Released': `
      <p>Full results from the 2026 Winter Regional are now available. Congratulations to all participants for an excellent weekend of competition at the Royal Canadian Legion Branch 51.</p>
      <h3>Highlights</h3>
      <p>This year's Winter Regional saw record participation with over 60 players competing across six categories. The atmosphere was electric from start to finish, with several matches going to deciding legs.</p>
      <p>Special congratulations to our category winners and to all players who represented their zones with pride. Full category-by-category results and DartConnect statistics are available on the <a href="/tournaments">Tournaments page</a>.</p>
      <h3>Thank You</h3>
      <p>A big thank you to our volunteers, the Legion Branch 51 staff, and all the players who made this event a success. We look forward to seeing everyone at the Labrador Open in March.</p>
    `,
    'Roster & Membership Deadline March 1st': `
      <p>All players must have current season membership by <strong>March 1st</strong> to be eligible for the Labrador Open (March 12-14). This is a firm deadline — no exceptions will be made.</p>
      <h3>How to Register</h3>
      <p>You can now register online through our <a href="/forms">Forms & Documents page</a>. Simply fill out the registration form and send your membership fee via e-Transfer to <strong>labradordarts23@gmail.com</strong>.</p>
      <ul>
        <li>Adult Membership: $60</li>
        <li>Youth Membership: $20</li>
      </ul>
      <h3>Questions?</h3>
      <p>Contact Tina Chiasson, Membership Director, or reach out through the <a href="/contact">Contact page</a> if you have any questions about your membership status.</p>
    `,
    'NDFC Rule Changes for 2026 Season': `
      <p>The National Darts Federation of Canada has announced several rule updates effective for the 2026 season. All LDA members should review the updated rulebook carefully.</p>
      <h3>Key Changes</h3>
      <ul>
        <li>Updated tie-breaker procedures for round-robin stages</li>
        <li>Revised ranking point allocation for regional qualifiers</li>
        <li>New guidelines for electronic scoring verification</li>
        <li>Updated code of conduct provisions</li>
      </ul>
      <p>The complete updated rulebook is available for download on our <a href="/forms">Forms & Documents page</a>. All tournament directors and players are expected to be familiar with these changes before the next sanctioned event.</p>
      <p>If you have questions about how these changes affect LDA events specifically, please reach out to the executive board.</p>
    `,
    'Labrador Open Registration Now Open': `
      <p>Registration for the <strong>Labrador Open</strong> (March 12–14) is now open! This is a Regional Qualifier for NDFC nationals and a National Ranking Tournament with $5,260+ in payouts at 100% payout.</p>
      <h3>Categories</h3>
      <ul>
        <li>Mixed Doubles</li>
        <li>Men's Doubles</li>
        <li>Ladies' Singles</li>
        <li>Mixed Triples</li>
        <li>Men's Singles</li>
        <li>Ladies' Doubles</li>
      </ul>
      <h3>How to Register</h3>
      <p>Visit the <a href="/forms">Forms page</a> to register online, or contact Des Montague directly. Registration deadline is <strong>March 10th</strong>.</p>
      <p>The tournament will be held at the Royal Canadian Legion Branch 51, Happy Valley-Goose Bay. We look forward to a great weekend of competition!</p>
    `,
    'Big Land Northern Classic Results': `
      <p>The Big Land Northern Classic wrapped up with incredible competition over the October 31 – November 2 weekend at the Royal Canadian Legion Branch 51 in Happy Valley-Goose Bay.</p>
      <h3>Category Winners</h3>
      <ul>
        <li><strong>Mixed Doubles:</strong> Philip Matthews & Kelly Matthews</li>
        <li><strong>Mixed Triples:</strong> Jacob Taylor, Barry Keough & Mary Pittman</li>
        <li><strong>Men's Doubles:</strong> Jacob Taylor & Sam Organ</li>
        <li><strong>Ladies' Singles:</strong> Ashley Broomfield</li>
        <li><strong>Men's Singles:</strong> Jacob Taylor</li>
        <li><strong>Ladies' Doubles:</strong> Ashley Broomfield & Kelly Matthews</li>
      </ul>
      <h3>DartConnect Statistics</h3>
      <p>Notable performances included Jacob Taylor's 12-dart leg in Men's Singles RR and Kevin Gear's 156 checkout. Full results and detailed DartConnect statistics are available on the <a href="/tournaments">Tournaments page</a>.</p>
      <p>Photos from the event are available in the <a href="/gallery">Photo Gallery</a>.</p>
    `,
    '2025-26 Membership Registration Open': `
      <p>Registration is now open for the 2025-2026 Labrador Darts Association season! Whether you're a returning player or new to organized darts in Labrador, we welcome you to join our growing community.</p>
      <h3>Membership Fees</h3>
      <ul>
        <li><strong>Adult:</strong> $60</li>
        <li><strong>Youth:</strong> $20</li>
      </ul>
      <h3>How to Register</h3>
      <p>You can now register online through our website. Visit the <a href="/forms">Forms & Documents page</a>, fill out the registration form, and send your membership fee via e-Transfer to <strong>labradordarts23@gmail.com</strong>.</p>
      <h3>Benefits of Membership</h3>
      <ul>
        <li>Eligibility for all LDA-sanctioned tournaments</li>
        <li>NDFC national ranking points at qualifying events</li>
        <li>Opportunity to represent Labrador at provincial and national championships</li>
        <li>Access to the LDA community and events calendar</li>
      </ul>
      <p>We're looking forward to a great season ahead. Contact Des Montague or Tina Chiasson if you have any questions.</p>
    `,
  };

  for (const article of articles) {
    if (updates[article.title]) {
      await prisma.newsArticle.update({
        where: { id: article.id },
        data: { body: updates[article.title] },
      });
      console.log(`Updated: ${article.title}`);
    }
  }

  console.log('Article bodies updated!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
