import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

interface Album {
  id: string;
  title: string;
  description: string | null;
  eventDate: string | null;
  season: string | null;
  coverImageUrl: string | null;
  _count: { photos: number };
}

export default function Gallery() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [seasons, setSeasons] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/gallery').then(({ data }) => {
      const list: Album[] = data.data || [];
      setAlbums(list);
      const s = [...new Set(list.map(a => a.season).filter(Boolean))] as string[];
      setSeasons(s);
    }).catch(() => {});
  }, [])

  const filtered = albums
    .filter(a => activeFilter === 'All' || a.season === activeFilter)
    .filter(a => {
      if (!search) return true
      const q = search.toLowerCase()
      return a.title.toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q) ||
        (a.season || '').toLowerCase().includes(q)
    })

  return (
    <section className="page-section">
      <div className="container">
        <div className="page-header animate-in">
          <p className="breadcrumb">Association / Gallery</p>
          <h1>Photo Gallery</h1>
          <p>Photos from tournaments, events, and community gatherings across Labrador.</p>
        </div>

        <div className="page-controls animate-in">
          <input
            type="text"
            className="search-input"
            placeholder="Search albums..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {seasons.length > 0 && (
            <div className="controls-right">
              <div className="gallery-filter">
                <button className={`filter-btn ${activeFilter === 'All' ? 'active' : ''}`} onClick={() => setActiveFilter('All')}>All</button>
                {seasons.map(s => (
                  <button key={s} className={`filter-btn ${activeFilter === s ? 'active' : ''}`} onClick={() => setActiveFilter(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="gallery-grid">
          {filtered.map((album, i) => (
            <Link to={`/gallery/${album.id}`} key={album.id} className={`gallery-item animate-in delay-${Math.min(i + 1, 5)}`}>
              {album.coverImageUrl ? (
                <img src={album.coverImageUrl} alt={album.title} className="gallery-photo" />
              ) : (
                <div className="gallery-placeholder">
                  <span style={{ fontSize: '2rem' }}>{album._count.photos}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>photos</span>
                </div>
              )}
              <div className="gallery-overlay">
                <h4>{album.title}</h4>
                <span>{album._count.photos} photo{album._count.photos !== 1 ? 's' : ''}{album.eventDate ? ` \u00b7 ${new Date(album.eventDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}</span>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="empty-state">{search ? 'No albums match your search.' : 'No gallery albums yet. Check back soon.'}</p>
          )}
        </div>
      </div>
    </section>
  )
}
