import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

interface StatCard { label: string; value: string; description: string }
interface NewsItem { id: string; title: string; excerpt: string | null; body: string; tag: string; publishedAt: string | null; createdAt: string }
interface Tournament { id: string; name: string; startDate: string; status: string; type: string | null }
interface Doc { id: string; title: string; fileType: string; fileSize: number | null }

const tagClass = (tag: string) => {
  const map: Record<string, string> = { official: 'tag-official', deadline: 'tag-deadline', update: 'tag-update', event: 'tag-event' }
  return map[tag] || 'tag-update'
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Home() {
  const [stats, setStats] = useState<Record<string, StatCard>>({})
  const [heroText, setHeroText] = useState({ eyebrow: 'Official Association Portal', title: 'Labrador Darts\nAssociation', subtitle: 'The central hub for tournament schedules, league standings, and community news across the Big Land.' })
  const [news, setNews] = useState<NewsItem[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [documents, setDocuments] = useState<Doc[]>([])

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      const s = data.data
      if (s?.stats) setStats(s.stats)
      if (s?.heroText) setHeroText({ ...heroText, ...s.heroText })
    }).catch(() => {})

    api.get('/news?limit=3').then(({ data }) => setNews(data.data?.articles || [])).catch(() => {})
    api.get('/tournaments').then(({ data }) => {
      const upcoming = (data.data || []).filter((t: Tournament) => t.status !== 'completed' && t.status !== 'cancelled').slice(0, 3)
      setTournaments(upcoming)
    }).catch(() => {})
    api.get('/documents?limit=3').then(({ data }) => setDocuments((data.data || []).slice(0, 3))).catch(() => {})
  }, [])

  const statKeys = ['nextTournament', 'activeMembers', 'currentSeason']
  const statDefaults: Record<string, StatCard> = {
    nextTournament: { label: 'Next Tournament', value: 'TBD', description: '' },
    activeMembers: { label: 'Active Members', value: '--', description: '' },
    currentSeason: { label: 'Current Season', value: '2025-26', description: '' },
  }

  const formatSize = (bytes: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-content animate-in">
          <div className="hero-layout">
            <div>
              <span className="hero-eyebrow">{heroText.eyebrow}</span>
              <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: heroText.title.replace('\n', '<br />') }} />
              <p className="hero-subtitle">{heroText.subtitle}</p>
              <div className="hero-actions">
                <Link to="/forms" className="btn btn-white">Join the 2026 Season</Link>
                <Link to="/tournaments" className="btn btn-outline-white">View Calendar</Link>
              </div>
            </div>
            <img src="/logo.png" alt="Labrador Darts Association" className="hero-logo" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {statKeys.map((key, i) => {
              const s = stats[key] || statDefaults[key]
              return (
                <div key={key} className={`stat-card animate-in delay-${i + 1}`}>
                  <span className="stat-label">{s.label}</span>
                  <span className="stat-value">{s.value}</span>
                  <span className="stat-desc">{s.description}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* News + Sidebar */}
      <section className="page-section">
        <div className="container">
          <div className="content-grid">
            <div>
              <h2 className="section-heading">Latest News</h2>
              <div className="card">
                {news.map((a, i) => (
                  <article key={a.id} className={`news-card animate-in delay-${i + 1}`}>
                    <div className="news-meta">
                      <span className={`news-tag ${tagClass(a.tag)}`}>{a.tag}</span>
                      <time>{new Date(a.publishedAt || a.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                    </div>
                    <h3><Link to="/news">{a.title}</Link></h3>
                    <p>{a.excerpt || a.body.slice(0, 200)}</p>
                  </article>
                ))}
                {news.length === 0 && <p style={{ padding: '1rem', opacity: 0.6 }}>No news yet.</p>}
                <Link to="/news" className="view-all-link">View All News &rarr;</Link>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="sidebar">
              <div className="sidebar-card">
                <h3 className="sidebar-heading">Upcoming Events</h3>
                <ul className="event-list">
                  {tournaments.map((t, i) => {
                    const d = new Date(t.startDate)
                    return (
                      <li key={t.id} className={`event-item ${i === 0 ? 'event-highlight' : ''}`}>
                        <div className="event-date-badge">
                          <span className="date-month">{SHORT_MONTHS[d.getMonth()]}</span>
                          <span className="date-day">{d.getDate()}</span>
                        </div>
                        <div>
                          <strong>{t.name}</strong>
                          <span>{t.type?.replace('_', ' ') || t.status}</span>
                        </div>
                      </li>
                    )
                  })}
                  {tournaments.length === 0 && <li className="event-item"><div><span>No upcoming events</span></div></li>}
                </ul>
                <Link to="/tournaments" className="sidebar-link">Full Schedule &rarr;</Link>
              </div>

              <div className="sidebar-card">
                <h3 className="sidebar-heading">Quick Forms</h3>
                <div className="form-links">
                  {documents.map(doc => (
                    <Link to="/forms" key={doc.id} className="form-link-item">
                      <span className="form-icon">{doc.fileType.toUpperCase()}</span>
                      <div>
                        <strong>{doc.title}</strong>
                        <span>{formatSize(doc.fileSize)}</span>
                      </div>
                    </Link>
                  ))}
                  {documents.length === 0 && (
                    <Link to="/forms" className="form-link-item">
                      <span className="form-icon">PDF</span>
                      <div><strong>View Forms</strong><span>Documents &amp; registration</span></div>
                    </Link>
                  )}
                </div>
                <Link to="/forms" className="sidebar-link">All Documents &rarr;</Link>
              </div>

              <div className="sidebar-card sidebar-card-accent">
                <h3 className="sidebar-heading">National Affiliation</h3>
                <p>The LDA is a proud member of the National Darts Federation of Canada (NDFC).</p>
                <a href="https://www.ndfc.ca/page/14819/Contacts" className="ndfc-link" target="_blank" rel="noopener noreferrer">Visit NDFC Canada &rarr;</a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Pathway */}
      <section className="pathway-section">
        <div className="container">
          <h2 className="section-heading center">Get Involved</h2>
          <p className="section-subtitle">Whether you're a seasoned competitor or picking up darts for the first time, there's a place for you in the LDA.</p>
          <div className="pathway-grid">
            <div className="pathway-card animate-in delay-1">
              <span className="pathway-number">1</span>
              <h3>Register</h3>
              <p>Become a member of the Labrador Darts Association. Open to all residents of Labrador.</p>
            </div>
            <div className="pathway-card animate-in delay-2">
              <span className="pathway-number">2</span>
              <h3>Compete</h3>
              <p>Enter LDA sanctioned zone shoots, the Big Land Northern Classic, and the LDA Provincial Championships.</p>
            </div>
            <div className="pathway-card animate-in delay-3">
              <span className="pathway-number">3</span>
              <h3>Advance</h3>
              <p>Earn your place on Team Labrador for the NDFC National Championships as well as opportunities to compete with Team Canada on the WDF Global Stage!</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
