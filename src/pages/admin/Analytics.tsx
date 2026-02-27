import { useState, useEffect } from 'react'
import api from '../../services/api'

interface Stats {
  totalViews: number
  todayViews: number
  weekViews: number
  monthViews: number
  topPages: { path: string; views: number }[]
  dailyTrend: { date: string; views: number }[]
}

const PAGE_LABELS: Record<string, string> = {
  '/': 'Home',
  '/about': 'About',
  '/tournaments': 'Tournaments',
  '/news': 'News',
  '/forms': 'Forms & Documents',
  '/gallery': 'Photo Gallery',
  '/contact': 'Contact',
}

function formatPath(path: string) {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path]
  if (path.startsWith('/news/')) return 'News Article'
  if (path.startsWith('/tournaments/')) return 'Tournament Detail'
  if (path.startsWith('/gallery/')) return 'Gallery Album'
  if (path.startsWith('/members/')) return 'Member Profile'
  return path
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

export default function Analytics() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/pageviews/stats')
      .then(({ data }) => setStats(data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header"><h1>Analytics</h1></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="admin-page">
        <div className="admin-page-header"><h1>Analytics</h1></div>
        <p className="admin-error">Failed to load analytics data.</p>
      </div>
    )
  }

  const maxDaily = Math.max(...stats.dailyTrend.map(d => d.views), 1)

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Analytics</h1>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.totalViews.toLocaleString()}</div>
          <div className="admin-stat-label">Total Views</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.todayViews.toLocaleString()}</div>
          <div className="admin-stat-label">Today</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.weekViews.toLocaleString()}</div>
          <div className="admin-stat-label">This Week</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.monthViews.toLocaleString()}</div>
          <div className="admin-stat-label">This Month</div>
        </div>
      </div>

      <section className="admin-section" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Last 30 Days</h2>
        {stats.dailyTrend.length === 0 ? (
          <p className="admin-empty">No data yet. Views will appear as visitors browse the site.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {stats.dailyTrend.map((day) => (
              <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                <span style={{ width: '4.5rem', color: 'var(--neutral-500)', flexShrink: 0, textAlign: 'right' }}>
                  {formatDate(day.date)}
                </span>
                <div style={{ flex: 1, background: 'var(--neutral-50)', borderRadius: '4px', height: '1.25rem', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(day.views / maxDaily) * 100}%`,
                      height: '100%',
                      background: 'var(--green-700)',
                      borderRadius: '4px',
                      minWidth: day.views > 0 ? '4px' : '0',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <span style={{ width: '3rem', color: 'var(--neutral-500)', flexShrink: 0 }}>
                  {day.views}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="admin-section" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Top Pages</h2>
        {stats.topPages.length === 0 ? (
          <p className="admin-empty">No data yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Page</th>
                <th style={{ textAlign: 'right' }}>Views</th>
              </tr>
            </thead>
            <tbody>
              {stats.topPages.map((page) => (
                <tr key={page.path}>
                  <td>
                    <strong>{formatPath(page.path)}</strong>
                    <span style={{ color: 'var(--neutral-400)', marginLeft: '0.5rem', fontSize: '0.8rem' }}>{page.path}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>{page.views.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
