import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ submissions: 0, members: 0, articles: 0, tournaments: 0 });
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/forms/admin/all?limit=5'),
      api.get('/members/admin/all?limit=1'),
      api.get('/news/admin/all'),
      api.get('/tournaments'),
    ]).then(([forms, members, news, tournaments]) => {
      setStats({
        submissions: forms.data.data.total,
        members: members.data.data.total,
        articles: news.data.data.length,
        tournaments: tournaments.data.data.length,
      });
      setRecentSubmissions(forms.data.data.submissions);
    }).catch(console.error);
  }, []);

  return (
    <div className="admin-page">
      <h1>Dashboard</h1>

      <div className="admin-stats-grid">
        <Link to="/admin/forms" className="admin-stat-card">
          <div className="admin-stat-value">{stats.submissions}</div>
          <div className="admin-stat-label">Form Submissions</div>
        </Link>
        <Link to="/admin/members" className="admin-stat-card">
          <div className="admin-stat-value">{stats.members}</div>
          <div className="admin-stat-label">Members</div>
        </Link>
        <Link to="/admin/news" className="admin-stat-card">
          <div className="admin-stat-value">{stats.articles}</div>
          <div className="admin-stat-label">News Articles</div>
        </Link>
        <Link to="/admin/tournaments" className="admin-stat-card">
          <div className="admin-stat-value">{stats.tournaments}</div>
          <div className="admin-stat-label">Tournaments</div>
        </Link>
      </div>

      <div className="admin-section">
        <h2>Recent Form Submissions</h2>
        {recentSubmissions.length === 0 ? (
          <p className="admin-empty">No submissions yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>Type</th><th>Name</th><th>Email</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {recentSubmissions.map((s) => (
                <tr key={s.id}>
                  <td><span className={`admin-badge badge-${s.formType}`}>{s.formType.replace('_', ' ')}</span></td>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td><span className={`admin-badge badge-${s.status}`}>{s.status}</span></td>
                  <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-quick-links">
        <Link to="/admin/news" className="btn btn-primary">Create News Article</Link>
        <Link to="/admin/tournaments" className="btn btn-secondary">Manage Tournaments</Link>
        <Link to="/admin/gallery" className="btn btn-secondary">Upload Photos</Link>
        <Link to="/admin/documents" className="btn btn-secondary">Upload Document</Link>
      </div>
    </div>
  );
}
