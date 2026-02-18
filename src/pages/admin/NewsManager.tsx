import { useState, useEffect, type FormEvent } from 'react';
import api from '../../services/api';
import RichTextEditor from '../../components/RichTextEditor';

interface Article {
  id: string;
  title: string;
  body: string;
  excerpt: string | null;
  tag: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export default function NewsManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [editing, setEditing] = useState<Article | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', excerpt: '', tag: 'update', isPublished: false });
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get('/news/admin/all').then(({ data }) => setArticles(data.data)).catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ title: '', body: '', excerpt: '', tag: 'update', isPublished: false });
    setEditing(null);
    setShowForm(false);
  };

  const editArticle = (a: Article) => {
    setForm({ title: a.title, body: a.body, excerpt: a.excerpt || '', tag: a.tag, isPublished: a.isPublished });
    setEditing(a);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/news/${editing.id}`, form);
      } else {
        await api.post('/news', form);
      }
      resetForm();
      load();
    } catch (err) {
      console.error(err);
      alert('Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  const deleteArticle = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    try {
      await api.delete(`/news/${id}`);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const togglePublish = async (a: Article) => {
    try {
      await api.put(`/news/${a.id}`, { isPublished: !a.isPublished });
      load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>News Articles</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          + New Article
        </button>
      </div>

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>{editing ? 'Edit Article' : 'New Article'}</h2>

          <label>
            Title
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>

          <label>
            Excerpt (short summary for cards)
            <input type="text" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
          </label>

          <label>
            Tag
            <select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })}>
              <option value="official">Official</option>
              <option value="deadline">Deadline</option>
              <option value="update">Update</option>
              <option value="event">Event</option>
            </select>
          </label>

          <label>
            Body
            <RichTextEditor value={form.body} onChange={(html) => setForm({ ...form, body: html })} />
          </label>

          <label className="admin-checkbox">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
            Published
          </label>

          <div className="admin-form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      )}

      <table className="admin-table">
        <thead>
          <tr><th>Title</th><th>Tag</th><th>Status</th><th>Date</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {articles.map((a) => (
            <tr key={a.id}>
              <td>{a.title}</td>
              <td><span className={`admin-badge badge-${a.tag}`}>{a.tag}</span></td>
              <td>
                <button className={`admin-badge badge-${a.isPublished ? 'published' : 'draft'}`} onClick={() => togglePublish(a)}>
                  {a.isPublished ? 'Published' : 'Draft'}
                </button>
              </td>
              <td>{new Date(a.createdAt).toLocaleDateString()}</td>
              <td className="admin-actions">
                <button onClick={() => editArticle(a)}>Edit</button>
                <button onClick={() => deleteArticle(a.id)} className="danger">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
