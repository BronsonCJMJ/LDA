export default function News() {
  const articles = [
    { date: 'February 24, 2026', tag: 'Official', tagClass: 'tag-official', title: 'Winter Regional Results Released', body: 'The official scores from Happy Valley-Goose Bay are now verified. Top 8 seeds have been notified of their provincial advancement. Full bracket and detailed match results are now available. Congratulations to all participants for an outstanding weekend of competition.' },
    { date: 'February 10, 2026', tag: 'Deadline', tagClass: 'tag-deadline', title: 'Roster Update Deadline Approaching', body: 'All clubs must finalize their player rosters by midnight this Friday. Incomplete submissions will result in a points deduction for the remainder of the winter session. Contact the LDA secretary if you need an extension.' },
    { date: 'January 28, 2026', tag: 'Update', tagClass: 'tag-update', title: 'New NDFC Rule Changes for 2026', body: 'The National Darts Federation of Canada has issued updated guidelines regarding equipment standards and scoring procedures for the 2026 competitive season. All LDA members should review the updated rulebook, available in the Forms & Documents section.' },
    { date: 'January 15, 2026', tag: 'Event', tagClass: 'tag-event', title: 'Winter League Season Kicks Off', body: 'The 2025–26 winter league season is officially underway. Teams have been drawn and the schedule is set. Check the Tournaments page for your first match dates. Good luck to all participating clubs.' },
    { date: 'December 20, 2025', tag: 'Official', tagClass: 'tag-official', title: 'Holiday Classic Raises Record Funds', body: 'This year\'s Holiday Classic charity tournament raised over $2,400 for local community programs — a new record for the event. Thank you to all participants, sponsors, and volunteers who made it possible.' },
    { date: 'December 1, 2025', tag: 'Update', tagClass: 'tag-update', title: '2026 Membership Registration Now Open', body: 'Registration for the 2026 competitive season is now open. Returning members can renew through the Forms section. New members should contact the LDA for information on joining a local club.' },
  ]

  return (
    <section className="page-section">
      <div className="container">
        <div className="page-header animate-in">
          <p className="breadcrumb">Association / News</p>
          <h1>News &amp; Announcements</h1>
          <p>Stay up to date with the latest from the Labrador Darts Association.</p>
        </div>

        <div className="news-page-grid">
          {articles.map((a, i) => (
            <article key={i} className={`news-page-card animate-in delay-${Math.min(i + 1, 5)}`}>
              <div className="news-meta">
                <span className={`news-tag ${a.tagClass}`}>{a.tag}</span>
                <time>{a.date}</time>
              </div>
              <h2>{a.title}</h2>
              <p>{a.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
