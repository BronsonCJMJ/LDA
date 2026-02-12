import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

interface MemberData {
  id: string
  firstName: string
  lastName: string
  zone: string | null
  membershipType: string
  tournamentAssignment: string | null
  qualifiedProvincials: boolean
  season: string | null
  ton80PlayerId: string | null
}

interface Ton80Player {
  id: string
  ton80Id: string
  firstName: string
  lastName: string
  nickname: string | null
}

interface Ton80Stats {
  ppdAverage: number | null
  gamesWon: number | null
  gamesLost: number | null
  oneEighties: number | null
  highestCheckout: number | null
  checkoutPercent: number | null
  rating: number | null
}

interface PublicStatsResponse {
  member: MemberData
  ton80Stats: { player: Ton80Player; stats: Ton80Stats } | null
}

export default function MemberProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<PublicStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    api
      .get(`/members/${id}/public-stats`)
      .then(({ data: res }) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 404) {
          setError('Member not found.')
        } else {
          setError('Failed to load member profile. Please try again later.')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <section className="page-section">
        <div className="container">
          <div className="page-header animate-in">
            <p className="breadcrumb">Members / Profile</p>
            <h1>Loading...</h1>
          </div>
          <div className="member-profile-skeleton">
            <div className="skeleton-block" />
            <div className="skeleton-block short" />
          </div>
        </div>
      </section>
    )
  }

  if (error || !data) {
    return (
      <section className="page-section">
        <div className="container">
          <div className="page-header animate-in">
            <p className="breadcrumb">Members / Profile</p>
            <h1>Member Profile</h1>
          </div>
          <div className="member-profile-error animate-in delay-1">
            <p>{error || 'Something went wrong.'}</p>
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>
              &larr; Go Back
            </button>
          </div>
        </div>
      </section>
    )
  }

  const { member, ton80Stats } = data

  return (
    <section className="page-section">
      <div className="container">
        <div className="page-header animate-in">
          <p className="breadcrumb">
            <Link to="/">Home</Link> / Member Profile
          </p>
          <h1>
            {member.firstName} {member.lastName}
          </h1>
          {member.zone && (
            <p>Zone {member.zone} &mdash; {member.membershipType} Member</p>
          )}
        </div>

        {/* Member Info */}
        <div className="member-profile-info animate-in delay-1">
          <h2 className="section-heading">Member Information</h2>
          <div className="detail-info-grid">
            <div className="detail-item">
              <span className="detail-label">Name</span>
              <span>
                {member.firstName} {member.lastName}
              </span>
            </div>
            {member.zone && (
              <div className="detail-item">
                <span className="detail-label">Zone</span>
                <span>{member.zone}</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Membership Type</span>
              <span>{member.membershipType}</span>
            </div>
            {member.tournamentAssignment && (
              <div className="detail-item">
                <span className="detail-label">Tournament Assignment</span>
                <span>{member.tournamentAssignment}</span>
              </div>
            )}
            {member.season && (
              <div className="detail-item">
                <span className="detail-label">Season</span>
                <span>{member.season}</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Qualified for Provincials</span>
              <span>{member.qualifiedProvincials ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* Ton80 Stats */}
        {ton80Stats ? (
          <div className="member-ton80-stats animate-in delay-2">
            <h2 className="section-heading">Ton80 Statistics</h2>
            <div className="stats-grid member-stats-grid">
              <div className="stat-card">
                <span className="stat-label">PPD Average</span>
                <span className="stat-value">
                  {ton80Stats.stats.ppdAverage != null
                    ? ton80Stats.stats.ppdAverage.toFixed(2)
                    : '--'}
                </span>
                <span className="stat-desc">Points Per Dart</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Games Won</span>
                <span className="stat-value">
                  {ton80Stats.stats.gamesWon ?? '--'}
                </span>
                <span className="stat-desc">
                  {ton80Stats.stats.gamesLost != null
                    ? `${ton80Stats.stats.gamesLost} lost`
                    : ''}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">180s</span>
                <span className="stat-value">
                  {ton80Stats.stats.oneEighties ?? '--'}
                </span>
                <span className="stat-desc">Perfect Rounds</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Highest Checkout</span>
                <span className="stat-value">
                  {ton80Stats.stats.highestCheckout ?? '--'}
                </span>
                <span className="stat-desc">Best Finish</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Checkout %</span>
                <span className="stat-value">
                  {ton80Stats.stats.checkoutPercent != null
                    ? `${ton80Stats.stats.checkoutPercent.toFixed(1)}%`
                    : '--'}
                </span>
                <span className="stat-desc">Double Hit Rate</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Rating</span>
                <span className="stat-value">
                  {ton80Stats.stats.rating ?? '--'}
                </span>
                <span className="stat-desc">Player Rating</span>
              </div>
            </div>
            <div className="member-ton80-link">
              <a
                href={`https://ton80.ca/players/${ton80Stats.player.ton80Id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                View Full Ton80 Profile &rarr;
              </a>
            </div>
          </div>
        ) : (
          <div className="member-no-ton80 animate-in delay-2">
            <p>This player hasn't linked their Ton80 profile yet.</p>
          </div>
        )}

        <div style={{ marginTop: 'var(--space-xl)' }}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            &larr; Back
          </button>
        </div>
      </div>
    </section>
  )
}
