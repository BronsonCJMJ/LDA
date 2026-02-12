import { useState, useEffect, type FormEvent, useRef } from 'react';
import api from '../../services/api';

interface Album {
  id: string;
  title: string;
  description: string | null;
  season: string | null;
  isPublished: boolean;
  _count: { photos: number };
}

export default function GalleryManager() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Album | null>(null);
  const [form, setForm] = useState({ title: '', description: '', season: '2025-26', isPublished: true });
  const [uploadAlbumId, setUploadAlbumId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    api.get('/gallery/admin/all').then(({ data }) => setAlbums(data.data)).catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ title: '', description: '', season: '2025-26', isPublished: true }); setEditing(null); setShowForm(false); };

  const editAlbum = (a: Album) => {
    setForm({ title: a.title, description: a.description || '', season: a.season || '', isPublished: a.isPublished });
    setEditing(a);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/gallery/${editing.id}`, form);
      } else {
        await api.post('/gallery', form);
      }
      resetForm();
      load();
    } catch {
      alert('Failed to save album');
    }
  };

  const deleteAlbum = async (id: string) => {
    if (!confirm('Delete this album and all its photos?')) return;
    await api.delete(`/gallery/${id}`);
    load();
  };

  const uploadPhotos = async (albumId: string, files: FileList) => {
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('photos', f));
      await api.post(`/gallery/${albumId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(`Uploaded ${files.length} photos`);
      load();
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
      setUploadAlbumId(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Gallery Albums</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ New Album</button>
      </div>

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>{editing ? 'Edit Album' : 'New Album'}</h2>
          <div className="admin-form-grid">
            <label>Title <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
            <label>Season <input type="text" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} /></label>
          </div>
          <label>Description <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label className="admin-checkbox"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Published</label>
          <div className="admin-form-actions">
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      )}

      <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files && uploadAlbumId) uploadPhotos(uploadAlbumId, e.target.files); }} />

      <div className="admin-album-grid">
        {albums.map((a) => (
          <div key={a.id} className="admin-album-card">
            <div className="admin-album-header">
              <h3>{a.title}</h3>
              <span className={`admin-badge badge-${a.isPublished ? 'published' : 'draft'}`}>{a.isPublished ? 'Published' : 'Draft'}</span>
            </div>
            <p>{a._count.photos} photos {a.season ? `• ${a.season}` : ''}</p>
            <div className="admin-actions">
              <button onClick={() => { setUploadAlbumId(a.id); fileRef.current?.click(); }} disabled={uploading}>
                {uploading && uploadAlbumId === a.id ? 'Uploading...' : 'Upload Photos'}
              </button>
              <button onClick={() => editAlbum(a)}>Edit</button>
              <button onClick={() => deleteAlbum(a.id)} className="danger">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
