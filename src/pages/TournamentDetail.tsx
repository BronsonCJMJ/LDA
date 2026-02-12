import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
import { generateGoogleCalendarUrl, downloadICS } from '../utils/calendar'

interface Result { id: string; category: string; placement: number; playerNames: string }
interface Stat { id: string; category: string; statType: string; rank: number; value: string; detail: string | null; playerNames: string }

interface TournamentFull {
  id: string; name: string; description: string | null; venue: string | null; location: string | null;
  startDate: string; endDate: string | null; registrationDeadline: string | null; registrationFee: string | null;
  entryFees: any; payoutStructure: any; status: string; type: string | null; flyerImageUrl: string | null; season: string | null;
  results: Result[]; stats: Stat[];
}

const STAT_LABELS: Record<string, string> = {
  fewest_501_darts: 'Fewest Darts (501)', highest_match_avg: 'Highest Match Average', highest_checkout: 'Highest Checkout',
}

export default function TournamentDetail() {
  const { id } = useParams()
  const [tournament, setTournament] = useState<TournamentFull | null>(null)

  useEffect(() => {
    if (id) api.get(`/tournaments/${id}`).then(({ data }) => setTournament(data.data)).catch(() => {});
  }, [id])

  if (!tournament) return <section className="page-section"><div className="container"><p>Loading...</p></div></section>

  const resultCategories = [...new Set(tournament.results.map(r => r.category))]
  const statCategories = [...new Set(tournament.stats.map(s => s.category))]

  const calEvent = { name: tournament.name, startDate: tournament.startDate, endDate: tournament.endDate || tournament.startDate, venue: tournament.venue, location: tournament.location, description: tournament.description }

  return (
    <section className="page-section">
      <div className="container">
        <div className="page-header animate-in">
          <p className="breadcrumb"><Link to="/tournaments">Tournaments</Link> / {tournament.name}</p>
          <h1>{tournament.name}</h1>
          {tournament.description && <p>{tournament.description}</p>}
        </div>

        <div className="tournament-detail-info animate-in delay-1">
          <div className="detail-info-grid">
            <div className="detail-item">
              <span className="detail-label">Date</span>
              <span>{new Date(tournament.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            {tournament.venue && (
              <div className="detail-item">
                <span className="detail-label">Venue</span>
                <span>{tournament.venue}{tournament.location ? `, ${tournament.location}` : ''}</span>
              </div>
            )}
            {tournament.registrationFee && (
              <div className="detail-item">
                <span className="detail-label">Registration Fee</span>
                <span>{tournament.registrationFee}</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span className={`tournament-status status-${tournament.status}`}>{tournament.status.replace('_', ' ')}</span>
            </div>
          </div>
          <div className="cal-buttons" style={{ marginTop: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => window.open(generateGoogleCalendarUrl(calEvent), '_blank')}>
              Add to Google Calendar
            </button>
            <button className="btn btn-secondary" onClick={() => downloadICS(calEvent)}>
              Download .ics
            </button>
          </div>
        </div>

        {resultCategories.length > 0 && (
          <div className="results-section animate-in delay-2">
            <h2 className="section-heading">Results</h2>
            {resultCategories.map(cat => (
              <div key={cat} className="results-category">
                <h3>{cat}</h3>
                <table className="results-table">
                  <thead><tr><th>Place</th><th>Player(s)</th></tr></thead>
                  <tbody>
                    {tournament.results.filter(r => r.category === cat).sort((a, b) => a.placement - b.placement).map(r => (
                      <tr key={r.id}>
                        <td className="placement-cell">
                          {r.placement === 1 ? '1st' : r.placement === 2 ? '2nd' : r.placement === 3 ? '3rd' : `${r.placement}th`}
                        </td>
                        <td>{r.playerNames}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {statCategories.length > 0 && (
          <div className="stats-section-detail animate-in delay-3">
            <h2 className="section-heading">Tournament Statistics</h2>
            {statCategories.map(cat => (
              <div key={cat} className="stats-category">
                <h3>{cat}</h3>
                <div className="stat-cards-grid">
                  {[...new Set(tournament.stats.filter(s => s.category === cat).map(s => s.statType))].map(type => {
                    const items = tournament.stats.filter(s => s.category === cat && s.statType === type).sort((a, b) => a.rank - b.rank)
                    return (
                      <div key={type} className="stat-detail-card">
                        <h4>{STAT_LABELS[type] || type.replace(/_/g, ' ')}</h4>
                        {items.map(s => (
                          <div key={s.id} className="stat-row">
                            <span className="stat-rank">#{s.rank}</span>
                            <span className="stat-player">{s.playerNames}</span>
                            <span className="stat-val">{s.value}</span>
                            {s.detail && <span className="stat-detail-text">{s.detail}</span>}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '2rem' }}>
          <Link to="/tournaments" className="btn btn-secondary">&larr; Back to Tournaments</Link>
        </div>
      </div>
    </section>
  )
}
