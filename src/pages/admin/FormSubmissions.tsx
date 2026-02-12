import { useState, useEffect } from 'react';
import api from '../../services/api';

interface Submission {
  id: string;
  formType: string;
  name: string | null;
  email: string | null;
  data: any;
  status: string;
  idDocumentUrl: string | null;
  notes: string | null;
  createdAt: string;
}

const FORM_TYPES = ['all', 'registration', 'protest_appeal', 'club_affiliation', 'contact'];

export default function FormSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [idUrl, setIdUrl] = useState<string | null>(null);

  const load = () => {
    const params: any = { limit: 50 };
    if (filter !== 'all') params.formType = filter;
    api.get('/forms/admin/all', { params }).then(({ data }) => {
      setSubmissions(data.data.submissions);
      setTotal(data.data.total);
    }).catch(console.error);
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/forms/admin/${id}`, { status });
    load();
  };

  const viewDetail = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    try {
      const { data } = await api.get(`/forms/admin/${id}`);
      if (data.data.idDocumentSignedUrl) setIdUrl(data.data.idDocumentSignedUrl);
      else setIdUrl(null);
    } catch {
      setIdUrl(null);
    }
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm('Delete this submission?')) return;
    await api.delete(`/forms/admin/${id}`);
    load();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Form Submissions ({total})</h1>
      </div>

      <div className="admin-filter-tabs">
        {FORM_TYPES.map((t) => (
          <button key={t} className={`filter-tab ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
            {t === 'all' ? 'All' : t.replace('_', ' ')}
          </button>
        ))}
      </div>

      <table className="admin-table">
        <thead>
          <tr><th>Type</th><th>Name</th><th>Email</th><th>Status</th><th>Date</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <>
              <tr key={s.id} onClick={() => viewDetail(s.id)} style={{ cursor: 'pointer' }}>
                <td><span className={`admin-badge badge-${s.formType}`}>{s.formType.replace('_', ' ')}</span></td>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>
                  <select value={s.status} onChange={(e) => { e.stopPropagation(); updateStatus(s.id, e.target.value); }}
                    onClick={(e) => e.stopPropagation()} className="admin-status-select">
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </td>
                <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                <td className="admin-actions">
                  <button onClick={(e) => { e.stopPropagation(); deleteSubmission(s.id); }} className="danger">Delete</button>
                </td>
              </tr>
              {expanded === s.id && (
                <tr key={`${s.id}-detail`} className="admin-detail-row">
                  <td colSpan={6}>
                    <div className="admin-submission-detail">
                      <h4>Submission Data</h4>
                      <pre>{JSON.stringify(s.data, null, 2)}</pre>
                      {idUrl && (
                        <div className="admin-id-preview">
                          <h4>Photo ID</h4>
                          <img src={idUrl} alt="ID Document" style={{ maxWidth: 400, borderRadius: 8 }} />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
