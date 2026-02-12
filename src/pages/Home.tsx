import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-content animate-in">
          <div className="hero-layout">
            <div>
              <span className="hero-eyebrow">Official Association Portal</span>
              <h1 className="hero-title">Labrador Darts<br />Association</h1>
              <p className="hero-subtitle">
                The central hub for tournament schedules, league standings, and community news across the Big Land.
              </p>
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
            <div className="stat-card animate-in delay-1">
              <span className="stat-label">Next Tournament</span>
              <span className="stat-value">Mar 12</span>
              <span className="stat-desc">Labrador Open — Regional Qualifier</span>
            </div>
            <div className="stat-card animate-in delay-2">
              <span className="stat-label">Active Members</span>
              <span className="stat-value">142</span>
              <span className="stat-desc">Registered for 2025–26 Season</span>
            </div>
            <div className="stat-card animate-in delay-3">
              <span className="stat-label">Current Season</span>
              <span className="stat-value">2025–26</span>
              <span className="stat-desc">Week 14 — Winter League</span>
            </div>
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
                <article className="news-card animate-in delay-1">
                  <div className="news-meta">
                    <span className="news-tag tag-official">Official</span>
                    <time>February 24, 2026</time>
                  </div>
                  <h3><Link to="/news">Winter Regional Results Released</Link></h3>
                  <p>The official scores from Happy Valley-Goose Bay are now verified. Top 8 seeds have been notified of their provincial advancement. Full bracket available in the tournament section.</p>
                </article>

                <article className="news-card animate-in delay-2">
                  <div className="news-meta">
                    <span className="news-tag tag-deadline">Deadline</span>
                    <time>February 10, 2026</time>
                  </div>
                  <h3><Link to="/news">Roster Update Deadline Approaching</Link></h3>
                  <p>Clubs must finalize their player lists by midnight Friday. Incomplete forms will result in a points penalty for the remainder of the winter session.</p>
                </article>

                <article className="news-card animate-in delay-3">
                  <div className="news-meta">
                    <span className="news-tag tag-update">Update</span>
                    <time>January 28, 2026</time>
                  </div>
                  <h3><Link to="/news">New NDFC Rule Changes for 2026</Link></h3>
                  <p>The National Darts Federation of Canada has issued updated guidelines regarding equipment standards and scoring procedures for the 2026 competitive season.</p>
                </article>

                <Link to="/news" className="view-all-link">View All News &rarr;</Link>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="sidebar">
              <div className="sidebar-card">
                <h3 className="sidebar-heading">Upcoming Events</h3>
                <ul className="event-list">
                  <li className="event-item event-highlight">
                    <div className="event-date-badge">
                      <span className="date-month">Mar</span>
                      <span className="date-day">12</span>
                    </div>
                    <div>
                      <strong>Labrador Open</strong>
                      <span>Regional Qualifier</span>
                    </div>
                  </li>
                  <li className="event-item">
                    <div className="event-date-badge">
                      <span className="date-month">Apr</span>
                      <span className="date-day">04</span>
                    </div>
                    <div>
                      <strong>Mixed Doubles</strong>
                      <span>Open Entry</span>
                    </div>
                  </li>
                  <li className="event-item">
                    <div className="event-date-badge">
                      <span className="date-month">May</span>
                      <span className="date-day">20</span>
                    </div>
                    <div>
                      <strong>Season Finale</strong>
                      <span>Championship Night</span>
                    </div>
                  </li>
                </ul>
                <Link to="/tournaments" className="sidebar-link">Full Schedule &rarr;</Link>
              </div>

              <div className="sidebar-card">
                <h3 className="sidebar-heading">Quick Forms</h3>
                <div className="form-links">
                  <a href="#" className="form-link-item">
                    <span className="form-icon">PDF</span>
                    <div>
                      <strong>Registration Form 2026</strong>
                      <span>124 KB</span>
                    </div>
                  </a>
                  <a href="#" className="form-link-item">
                    <span className="form-icon">PDF</span>
                    <div>
                      <strong>Score Sheet Template</strong>
                      <span>89 KB</span>
                    </div>
                  </a>
                  <a href="#" className="form-link-item">
                    <span className="form-icon">PDF</span>
                    <div>
                      <strong>LDA Bylaws</strong>
                      <span>2.1 MB</span>
                    </div>
                  </a>
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
              <p>Secure your spot in the 2026 regional circuit. Open to all skill levels from amateur to semi-pro.</p>
            </div>
            <div className="pathway-card animate-in delay-2">
              <span className="pathway-number">2</span>
              <h3>Compete</h3>
              <p>Participate in the Labrador Open, Mixed Doubles, and league nights throughout the winter and spring.</p>
            </div>
            <div className="pathway-card animate-in delay-3">
              <span className="pathway-number">3</span>
              <h3>Advance</h3>
              <p>Track your performance on our standings board and qualify for the NDFC provincial finals.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
