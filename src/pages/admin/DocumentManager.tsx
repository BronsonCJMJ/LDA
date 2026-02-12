import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

interface Doc {
  id: string;
  title: string;
  description: string | null;
  fileType: string;
  fileSize: number | null;
  category: string;
  isPublished: boolean;
}

export default function DocumentManager() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    api.get('/documents/admin/all').then(({ data }) => setDocs(data.data)).catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !title) { alert('Title and file required'); return; }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);

    try {
      await api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setTitle('');
      setDescription('');
      setCategory('general');
      setShowUpload(false);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deleteDoc = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    await api.delete(`/documents/${id}`);
    load();
  };

  const togglePublish = async (d: Doc) => {
    await api.put(`/documents/${d.id}`, { isPublished: !d.isPublished });
    load();
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Documents</h1>
        <button className="btn btn-primary" onClick={() => setShowUpload(!showUpload)}>+ Upload Document</button>
      </div>

      {showUpload && (
        <div className="admin-form">
          <h2>Upload Document</h2>
          <label>Title <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
          <label>Description <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} /></label>
          <label>Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="general">General</option>
              <option value="registration">Registration</option>
              <option value="rules">Rules</option>
              <option value="templates">Templates</option>
              <option value="bylaws">Bylaws</option>
            </select>
          </label>
          <label>File <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" /></label>
          <div className="admin-form-actions">
            <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
            <button className="btn btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
          </div>
        </div>
      )}

      <table className="admin-table">
        <thead>
          <tr><th>Title</th><th>Type</th><th>Size</th><th>Category</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d.id}>
              <td>{d.title}</td>
              <td className="admin-file-type">{d.fileType.toUpperCase()}</td>
              <td>{formatSize(d.fileSize)}</td>
              <td>{d.category}</td>
              <td>
                <button className={`admin-badge badge-${d.isPublished ? 'published' : 'draft'}`} onClick={() => togglePublish(d)}>
                  {d.isPublished ? 'Published' : 'Hidden'}
                </button>
              </td>
              <td className="admin-actions">
                <button onClick={() => deleteDoc(d.id)} className="danger">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
