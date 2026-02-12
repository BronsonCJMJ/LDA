import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { generateGoogleCalendarUrl, downloadICS, type CalendarEvent } from '../utils/calendar'

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  venue: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  registrationDeadline: string | null;
  registrationFee: string | null;
  entryFees: any;
  payoutStructure: any;
  status: string;
  type: string | null;
  flyerImageUrl: string | null;
  season: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  upcoming: 'Coming Soon', open: 'Registration Open', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled',
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

function toCalendarEvent(t: Tournament): CalendarEvent {
  return {
    name: t.name,
    startDate: t.startDate,
    endDate: t.endDate || t.startDate,
    venue: t.venue,
    location: t.location,
    description: t.description,
  }
}

export default function Tournaments() {
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [calendarOpen, setCalendarOpen] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc' | 'name'>('date-asc')

  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())

  useEffect(() => {
    api.get('/tournaments').then(({ data }) => setTournaments(data.data || [])).catch(() => {});
  }, [])

  const filtered = tournaments
    .filter(t => {
      if (!search) return true
      const q = search.toLowerCase()
      return t.name.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.venue || '').toLowerCase().includes(q) ||
        (t.location || '').toLowerCase().includes(q) ||
        (t.status || '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'date-desc') return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    })

  const tournamentsForDay = (day: number) => {
    const d = new Date(calYear, calMonth, day)
    return tournaments.filter(t => {
      const start = new Date(t.startDate)
      const end = t.endDate ? new Date(t.endDate) : start
      return d >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
             d <= new Date(end.getFullYear(), end.getMonth(), end.getDate())
    })
  }

  const deadlinesForDay = (day: number) => {
    const d = new Date(calYear, calMonth, day)
    return tournaments.filter(t => t.registrationDeadline && isSameDay(new Date(t.registrationDeadline), d))
  }

  const prevMonth = () => { if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11); } else setCalMonth(calMonth - 1); }
  const nextMonth = () => { if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0); } else setCalMonth(calMonth + 1); }

  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDay = getFirstDayOfMonth(calYear, calMonth)

  return (
    <section className="page-section">
      <div className="container">
        <div className="page-header animate-in">
          <p className="breadcrumb">Association / Tournaments</p>
          <h1>Tournaments &amp; Events</h1>
          <p>View the full schedule for the competitive season. Click any event for details and to add it to your calendar.</p>
        </div>

        <div className="page-controls animate-in">
          <input
            type="text"
            className="search-input"
            placeholder="Search tournaments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="controls-right">
            <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
              <option value="date-asc">Date (Earliest)</option>
              <option value="date-desc">Date (Latest)</option>
              <option value="name">Name (A-Z)</option>
            </select>
            <div className="view-toggle">
              <button className={`toggle-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>List</button>
              <button className={`toggle-btn ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>Calendar</button>
            </div>
          </div>
        </div>

        {view === 'list' ? (
          <div className="tournaments-list">
            {filtered.map((t, i) => (
              <div key={t.id} className={`tournament-card animate-in delay-${Math.min(i + 1, 5)}`} onClick={() => setSelectedTournament(t)} style={{ cursor: 'pointer' }}>
                <div className="tournament-date">
                  <span className="t-month">{SHORT_MONTHS[new Date(t.startDate).getMonth()]}</span>
                  <span className="t-day">{new Date(t.startDate).getDate()}</span>
                </div>
                <div className="tournament-info">
                  <h3>{t.name}</h3>
                  <p>{t.description}</p>
                  {t.venue && <span className="tournament-venue">{t.venue}{t.location ? `, ${t.location}` : ''}</span>}
                </div>
                <div className="tournament-actions-col">
                  <span className={`tournament-status status-${t.status}`}>{STATUS_LABELS[t.status] || t.status}</span>
                  <div className="add-to-cal-wrap" onClick={e => e.stopPropagation()}>
                    <button className="btn-add-cal" onClick={() => setCalendarOpen(calendarOpen === t.id ? null : t.id)} title="Add to Calendar">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    </button>
                    {calendarOpen === t.id && (
                      <div className="cal-dropdown">
                        <button onClick={() => { window.open(generateGoogleCalendarUrl(toCalendarEvent(t)), '_blank'); setCalendarOpen(null); }}>Google Calendar</button>
                        <button onClick={() => { downloadICS(toCalendarEvent(t)); setCalendarOpen(null); }}>Download .ics (Apple/Outlook)</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="empty-state">{search ? 'No tournaments match your search.' : 'No tournaments scheduled yet.'}</p>}
          </div>
        ) : (
          <div className="calendar-view animate-in">
            <div className="calendar-header">
              <button className="cal-nav-btn" onClick={prevMonth}>&larr;</button>
              <h2>{MONTHS[calMonth]} {calYear}</h2>
              <button className="cal-nav-btn" onClick={nextMonth}>&rarr;</button>
            </div>
            <div className="calendar-grid">
              {WEEKDAYS.map(d => <div key={d} className="cal-weekday">{d}</div>)}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="cal-day empty" />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const events = tournamentsForDay(day)
                const deadlines = deadlinesForDay(day)
                const isToday = isSameDay(new Date(calYear, calMonth, day), now)
                return (
                  <div key={day} className={`cal-day ${isToday ? 'today' : ''} ${events.length > 0 ? 'has-event' : ''} ${deadlines.length > 0 ? 'has-deadline' : ''}`}>
                    <span className="cal-day-number">{day}</span>
                    {events.map(e => (
                      <button key={e.id} className="cal-event-dot" onClick={() => setSelectedTournament(e)} title={e.name}>
                        {e.name.length > 12 ? e.name.slice(0, 12) + '...' : e.name}
                      </button>
                    ))}
                    {deadlines.map(d => (
                      <button key={`dl-${d.id}`} className="cal-deadline-dot" onClick={() => navigate('/forms?tab=registration')} title={`Registration deadline: ${d.name} — Click to register`}>
                        Deadline
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>

            <div className="calendar-legend">
              <span><span className="legend-dot event-dot" /> Tournament</span>
              <span><span className="legend-dot deadline-dot" /> Registration Deadline</span>
              <span><span className="legend-dot today-dot" /> Today</span>
            </div>
          </div>
        )}
      </div>

      {selectedTournament && (
        <div className="modal-overlay" onClick={() => setSelectedTournament(null)}>
          <div className="modal-content tournament-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedTournament(null)}>&times;</button>
            <div className="tournament-detail-header">
              <span className={`tournament-status status-${selectedTournament.status}`}>{STATUS_LABELS[selectedTournament.status] || selectedTournament.status}</span>
              {selectedTournament.type && <span className="tournament-type-badge">{selectedTournament.type.replace('_', ' ')}</span>}
            </div>
            <h2>{selectedTournament.name}</h2>
            {selectedTournament.description && <p className="tournament-detail-desc">{selectedTournament.description}</p>}

            <div className="tournament-detail-grid">
              <div className="detail-item">
                <span className="detail-label">Date</span>
                <span>{new Date(selectedTournament.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                {selectedTournament.endDate && selectedTournament.endDate !== selectedTournament.startDate && (
                  <span> &mdash; {new Date(selectedTournament.endDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                )}
              </div>
              {selectedTournament.venue && (
                <div className="detail-item">
                  <span className="detail-label">Venue</span>
                  <span>{selectedTournament.venue}{selectedTournament.location ? `, ${selectedTournament.location}` : ''}</span>
                </div>
              )}
              {selectedTournament.registrationDeadline && (
                <div className="detail-item">
                  <span className="detail-label">Registration Deadline</span>
                  <span>{new Date(selectedTournament.registrationDeadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
              {selectedTournament.registrationFee && (
                <div className="detail-item">
                  <span className="detail-label">Registration Fee</span>
                  <span>{selectedTournament.registrationFee}</span>
                </div>
              )}
              {selectedTournament.entryFees && Object.keys(selectedTournament.entryFees).length > 0 && (
                <div className="detail-item">
                  <span className="detail-label">Entry Fees by Category</span>
                  {Object.entries(selectedTournament.entryFees).map(([cat, fee]) => (
                    <span key={cat}>{cat}: {String(fee)}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="tournament-detail-actions">
              <Link to={`/tournaments/${selectedTournament.id}`} className="btn btn-primary" onClick={() => setSelectedTournament(null)}>View Full Details &amp; Results</Link>
              {(selectedTournament.status === 'open' || selectedTournament.status === 'upcoming') && (
                <Link to="/forms?tab=registration" className="btn btn-accent" onClick={() => setSelectedTournament(null)}>Register Now</Link>
              )}
              <div className="cal-buttons">
                <button className="btn btn-secondary" onClick={() => window.open(generateGoogleCalendarUrl(toCalendarEvent(selectedTournament)), '_blank')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  Google Calendar
                </button>
                <button className="btn btn-secondary" onClick={() => downloadICS(toCalendarEvent(selectedTournament))}>
                  Download .ics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
