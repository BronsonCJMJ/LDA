import { useState } from 'react'

interface GalleryItem {
  title: string
  date: string
  category: string
  image?: string
  icon?: string
}

const galleryItems: GalleryItem[] = [
  { title: 'Team Labrador — NDFC Nationals', date: '2025', category: '2024-25', image: '/team-labrador.jpg' },
  { title: 'Winter Regional 2026', date: 'Feb 2026', category: '2025-26', icon: '🎯' },
  { title: 'Holiday Classic', date: 'Dec 2025', category: '2025-26', icon: '🏆' },
  { title: 'Season Opener', date: 'Oct 2025', category: '2025-26', icon: '🎯' },
  { title: 'Provincial Finals', date: 'May 2025', category: '2024-25', icon: '🏅' },
  { title: 'Spring Doubles', date: 'Apr 2025', category: '2024-25', icon: '🎯' },
  { title: 'Awards Banquet', date: 'Jun 2025', category: '2024-25', icon: '🏆' },
  { title: 'Labrador Open 2025', date: 'Mar 2025', category: '2024-25', icon: '🎯' },
  { title: 'Community Night', date: 'Nov 2024', category: '2024-25', icon: '🎯' },
]

const filters = ['All', '2025-26', '2024-25']

export default function Gallery() {
  const [activeFilter, setActiveFilter] = useState('All')

  const filtered = activeFilter === 'All'
    ? galleryItems
    : galleryItems.filter(item => item.category === activeFilter)

  return (
    <section className="page-section">
      <div className="container">
        <div className="page-header animate-in">
          <p className="breadcrumb">Association / Gallery</p>
          <h1>Photo Gallery</h1>
          <p>Photos from tournaments, events, and community gatherings across Labrador.</p>
        </div>

        <div className="gallery-filter">
          {filters.map(f => (
            <button
              key={f}
              className={`filter-btn ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f === 'All' ? 'All Seasons' : `${f} Season`}
            </button>
          ))}
        </div>

        <div className="gallery-grid">
          {filtered.map((item, i) => (
            <div key={i} className={`gallery-item animate-in delay-${Math.min(i + 1, 5)}`}>
              {item.image ? (
                <img src={item.image} alt={item.title} className="gallery-photo" />
              ) : (
                <div className="gallery-placeholder">{item.icon}</div>
              )}
              <div className="gallery-overlay">
                <h4>{item.title}</h4>
                <span>{item.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
