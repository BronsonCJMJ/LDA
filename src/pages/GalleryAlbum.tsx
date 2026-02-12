import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'

interface Photo {
  id: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
}

interface AlbumDetail {
  id: string;
  title: string;
  description: string | null;
  eventDate: string | null;
  season: string | null;
  photos: Photo[];
}

export default function GalleryAlbum() {
  const { id } = useParams()
  const [album, setAlbum] = useState<AlbumDetail | null>(null)
  const [lightbox, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    if (id) {
      api.get(`/gallery/${id}`).then(({ data }) => setAlbum(data.data)).catch(() => {});
    }
  }, [id])

  if (!album) return <section className="page-section"><div className="container"><p>Loading...</p></div></section>

  return (
    <section className="page-section">
      <div className="container">
        <div className="page-header animate-in">
          <p className="breadcrumb"><Link to="/gallery">Gallery</Link> / {album.title}</p>
          <h1>{album.title}</h1>
          {album.description && <p>{album.description}</p>}
          {album.eventDate && <p style={{ opacity: 0.7 }}>{new Date(album.eventDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>}
        </div>

        <div className="gallery-grid">
          {album.photos.map((photo, i) => (
            <div key={photo.id} className={`gallery-item animate-in delay-${Math.min(i + 1, 5)}`} onClick={() => setLightbox(i)} style={{ cursor: 'pointer' }}>
              <img src={photo.imageUrl} alt={photo.caption || album.title} className="gallery-photo" loading="lazy" />
              {photo.caption && (
                <div className="gallery-overlay">
                  <span>{photo.caption}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {album.photos.length === 0 && <p className="empty-state">No photos in this album yet.</p>}

        <div style={{ marginTop: '2rem' }}>
          <Link to="/gallery" className="btn btn-secondary">&larr; Back to Gallery</Link>
        </div>
      </div>

      {lightbox !== null && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightbox(null)}>&times;</button>
            <img src={album.photos[lightbox].imageUrl} alt={album.photos[lightbox].caption || ''} />
            {album.photos[lightbox].caption && <p className="lightbox-caption">{album.photos[lightbox].caption}</p>}
            <div className="lightbox-nav">
              <button disabled={lightbox === 0} onClick={() => setLightbox(lightbox - 1)}>&larr; Prev</button>
              <span>{lightbox + 1} / {album.photos.length}</span>
              <button disabled={lightbox === album.photos.length - 1} onClick={() => setLightbox(lightbox + 1)}>Next &rarr;</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
