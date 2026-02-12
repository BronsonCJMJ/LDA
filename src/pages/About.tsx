import { useState, useEffect } from 'react'
import api from '../services/api'

interface BoardMember { name: string; title: string; initials: string }

export default function About() {
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([])

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      const bm = data.data?.boardMembers;
      if (Array.isArray(bm)) setBoardMembers(bm);
    }).catch(() => {});
  }, [])

  return (
    <section className="page-section">
      <div className="container">
        <div className="page-header animate-in">
          <p className="breadcrumb">Association / About</p>
          <h1>About the LDA</h1>
          <p>The Labrador Darts Association is the governing body for competitive and community darts across the Big Land.</p>
        </div>

        <div className="about-grid">
          <div className="about-text animate-in delay-1">
            <h2>Our Mission</h2>
            <p>The Labrador Darts Association (LDA) exists to promote the sport of darts throughout Labrador by organizing tournaments, maintaining fair standings, and fostering a welcoming community for players of all skill levels.</p>
            <p>As a proud affiliate of the National Darts Federation of Canada (NDFC), we connect local players to national competition pathways and uphold the highest standards of sportsmanship and fair play.</p>
          </div>
          <div className="about-text animate-in delay-2">
            <h2>What We Do</h2>
            <p>We coordinate the annual competitive season, including regional qualifiers, the Labrador Open, Mixed Doubles tournaments, and league play throughout the winter and spring months.</p>
            <p>The LDA also maintains official standings, manages player registration, and serves as the central source of information for all darts-related activities in the region.</p>
          </div>
        </div>

        <h2 className="section-heading" style={{ marginTop: '2rem' }}>Executive Board</h2>
        <div className="board-grid">
          {boardMembers.length > 0 ? (
            boardMembers.map((m, i) => (
              <div key={i} className={`board-member animate-in delay-${Math.min(i + 1, 5)}`}>
                <div className="board-member-avatar">{m.initials || m.name.charAt(0)}</div>
                <h4>{m.name}</h4>
                <p>{m.title}</p>
              </div>
            ))
          ) : (
            <div className="board-member animate-in delay-1">
              <div className="board-member-avatar">DM</div>
              <h4>Des Montague</h4>
              <p>President</p>
            </div>
          )}
        </div>

        <div className="sidebar-card sidebar-card-accent animate-in delay-3" style={{ marginTop: '3rem', maxWidth: '500px' }}>
          <h3 className="sidebar-heading">National Affiliation</h3>
          <p>The LDA is a proud member of the National Darts Federation of Canada (NDFC), connecting Labrador players to provincial and national competition.</p>
          <a href="https://www.ndfc.ca/page/14819/Contacts" className="ndfc-link" target="_blank" rel="noopener noreferrer">Visit NDFC Canada &rarr;</a>
        </div>
      </div>
    </section>
  )
}
