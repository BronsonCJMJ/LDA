export default function Tournaments() {
  const tournaments = [
    { month: 'Mar', day: '12', name: 'Labrador Open', desc: 'Regional Qualifier — Open to all registered LDA members. Top seeds advance to provincial competition.', status: 'open', statusLabel: 'Registration Open' },
    { month: 'Apr', day: '04', name: 'Mixed Doubles', desc: 'Open entry mixed doubles tournament. Teams of two, round-robin format followed by elimination bracket.', status: 'upcoming', statusLabel: 'Coming Soon' },
    { month: 'May', day: '20', name: 'Season Finale', desc: 'Championship night closing out the 2025–26 season. Awards ceremony and final standings announcement.', status: 'upcoming', statusLabel: 'Coming Soon' },
    { month: 'Jan', day: '15', name: 'Winter League Opener', desc: 'Season kickoff event at the Happy Valley-Goose Bay community center. League standings reset for winter session.', status: 'completed', statusLabel: 'Completed' },
    { month: 'Dec', day: '08', name: 'Holiday Classic', desc: 'Annual pre-holiday charity tournament. All proceeds donated to local community programs.', status: 'completed', statusLabel: 'Completed' },
  ]

  return (
    <section className="page-section">
      <div className="container">
        <div className="page-header animate-in">
          <p className="breadcrumb">Association / Tournaments</p>
          <h1>Tournaments &amp; Events</h1>
          <p>View the full schedule for the 2025–26 competitive season. Registration opens approximately 4 weeks before each event.</p>
        </div>

        {tournaments.map((t, i) => (
          <div key={i} className={`tournament-card animate-in delay-${Math.min(i + 1, 5)}`}>
            <div className="tournament-date">
              <span className="t-month">{t.month}</span>
              <span className="t-day">{t.day}</span>
            </div>
            <div className="tournament-info">
              <h3>{t.name}</h3>
              <p>{t.desc}</p>
            </div>
            <span className={`tournament-status status-${t.status}`}>{t.statusLabel}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
