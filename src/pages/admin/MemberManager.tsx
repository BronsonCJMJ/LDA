import { useState, useEffect, type FormEvent } from 'react';
import api from '../../services/api';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  membershipStatus: string;
  membershipPaid: boolean;
  membershipType: string;
  zone: string | null;
  tournamentAssignment: string | null;
  qualifiedProvincials: boolean;
  season: string | null;
  ton80PlayerId: string | null;
}

export default function MemberManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Member | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', sex: '', mailingAddress: '',
    membershipStatus: 'active', membershipPaid: true, membershipType: 'adult',
    zone: '', tournamentAssignment: '', qualifiedProvincials: false, season: '2025-26',
  });
  const [saving, setSaving] = useState(false);
  const [ton80Modal, setTon80Modal] = useState<Member | null>(null);
  const [ton80Id, setTon80Id] = useState('');
  const [ton80Linking, setTon80Linking] = useState(false);
  const [ton80Result, setTon80Result] = useState<string | null>(null);
  const [ton80Error, setTon80Error] = useState<string | null>(null);

  const load = () => {
    api.get('/members/admin/all', { params: { search: search || undefined } })
      .then(({ data }) => { setMembers(data.data.members); setTotal(data.data.total); })
      .catch(console.error);
  };

  useEffect(() => { load(); }, [search]);

  const resetForm = () => {
    setForm({ firstName: '', lastName: '', email: '', phone: '', sex: '', mailingAddress: '', membershipStatus: 'active', membershipPaid: true, membershipType: 'adult', zone: '', tournamentAssignment: '', qualifiedProvincials: false, season: '2025-26' });
    setEditing(null);
    setShowForm(false);
  };

  const editMember = (m: Member) => {
    setForm({
      firstName: m.firstName, lastName: m.lastName, email: m.email || '', phone: m.phone || '',
      sex: '', mailingAddress: '', membershipStatus: m.membershipStatus, membershipPaid: m.membershipPaid,
      membershipType: m.membershipType, zone: m.zone || '', tournamentAssignment: m.tournamentAssignment || '',
      qualifiedProvincials: m.qualifiedProvincials, season: m.season || '',
    });
    setEditing(m);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/members/${editing.id}`, form);
      } else {
        await api.post('/members', form);
      }
      resetForm();
      load();
    } catch {
      alert('Failed to save member');
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async (id: string) => {
    if (!confirm('Delete this member?')) return;
    await api.delete(`/members/${id}`);
    load();
  };

  const openTon80Modal = (m: Member) => {
    setTon80Modal(m);
    setTon80Id('');
    setTon80Result(null);
    setTon80Error(null);
  };

  const linkTon80 = async () => {
    if (!ton80Modal || !ton80Id.trim()) return;
    setTon80Linking(true);
    setTon80Error(null);
    setTon80Result(null);
    try {
      const { data } = await api.post(`/members/${ton80Modal.id}/link-ton80`, { ton80Id: ton80Id.trim() });
      setTon80Result(data.data.ton80Player);
      load();
    } catch (err: any) {
      setTon80Error(err.response?.data?.error || err.response?.data?.message || 'Failed to link Ton80 player');
    } finally {
      setTon80Linking(false);
    }
  };

  const unlinkTon80 = async (m: Member) => {
    if (!confirm(`Unlink Ton80 player from ${m.firstName} ${m.lastName}?`)) return;
    try {
      await api.delete(`/members/${m.id}/link-ton80`);
      load();
    } catch {
      alert('Failed to unlink Ton80 player');
    }
  };

  const handleCsvImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      const lines = text.split('\n').filter((l: string) => l.trim());
      const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());

      const members = lines.slice(1).map((line: string) => {
        const values = line.split(',').map((v: string) => v.trim());
        const row: any = {};
        headers.forEach((h: string, i: number) => {
          if (h.includes('first')) row.firstName = values[i];
          else if (h.includes('last')) row.lastName = values[i];
          else if (h.includes('email')) row.email = values[i];
          else if (h.includes('phone')) row.phone = values[i];
          else if (h.includes('zone')) row.zone = values[i];
          else if (h.includes('season')) row.season = values[i];
        });
        return row;
      }).filter((m: any) => m.firstName && m.lastName);

      if (members.length === 0) { alert('No valid members found in CSV'); return; }
      if (!confirm(`Import ${members.length} members?`)) return;

      try {
        const { data } = await api.post('/members/import', { members });
        alert(`Imported ${data.data.count} members`);
        load();
      } catch {
        alert('Import failed');
      }
    };
    input.click();
  };

  const exportCsv = () => {
    const csv = ['First Name,Last Name,Email,Phone,Zone,Status,Paid,Type,Season']
      .concat(members.map((m) =>
        `${m.firstName},${m.lastName},${m.email || ''},${m.phone || ''},${m.zone || ''},${m.membershipStatus},${m.membershipPaid},${m.membershipType},${m.season || ''}`
      )).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lda-members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Members ({total})</h1>
        <div className="admin-header-actions">
          <button className="btn btn-secondary" onClick={handleCsvImport}>Import CSV</button>
          <button className="btn btn-secondary" onClick={exportCsv}>Export CSV</button>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ Add Member</button>
        </div>
      </div>

      <input type="search" placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} className="admin-search" />

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>{editing ? 'Edit Member' : 'New Member'}</h2>
          <div className="admin-form-grid">
            <label>First Name <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></label>
            <label>Last Name <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></label>
            <label>Email <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label>Phone <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            <label>Zone <input type="text" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} /></label>
            <label>Season <input type="text" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} /></label>
            <label>Status
              <select value={form.membershipStatus} onChange={(e) => setForm({ ...form, membershipStatus: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </label>
            <label>Type
              <select value={form.membershipType} onChange={(e) => setForm({ ...form, membershipType: e.target.value })}>
                <option value="adult">Adult ($60)</option>
                <option value="youth">Youth ($20)</option>
              </select>
            </label>
            <label>Tournament Assignment <input type="text" value={form.tournamentAssignment} onChange={(e) => setForm({ ...form, tournamentAssignment: e.target.value })} /></label>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label className="admin-checkbox"><input type="checkbox" checked={form.membershipPaid} onChange={(e) => setForm({ ...form, membershipPaid: e.target.checked })} /> Membership Paid</label>
            <label className="admin-checkbox"><input type="checkbox" checked={form.qualifiedProvincials} onChange={(e) => setForm({ ...form, qualifiedProvincials: e.target.checked })} /> Qualified for Provincials</label>
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      )}

      <table className="admin-table">
        <thead>
          <tr><th>Name</th><th>Zone</th><th>Type</th><th>Status</th><th>Paid</th><th>Ton80</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td>{m.firstName} {m.lastName}</td>
              <td>{m.zone || '—'}</td>
              <td>{m.membershipType}</td>
              <td><span className={`admin-badge badge-${m.membershipStatus}`}>{m.membershipStatus}</span></td>
              <td>{m.membershipPaid ? '✓' : '—'}</td>
              <td>
                {m.ton80PlayerId ? (
                  <span className="admin-badge badge-active" style={{ cursor: 'pointer' }} onClick={() => unlinkTon80(m)} title="Click to unlink">Ton80 Linked</span>
                ) : (
                  <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }} onClick={() => openTon80Modal(m)}>Link Ton80</button>
                )}
              </td>
              <td className="admin-actions">
                <button onClick={() => editMember(m)}>Edit</button>
                <button onClick={() => deleteMember(m.id)} className="danger">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {ton80Modal && (
        <div className="admin-modal-overlay" onClick={() => setTon80Modal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <h2>Link Ton80 Player</h2>
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
              Linking <strong>{ton80Modal.firstName} {ton80Modal.lastName}</strong> to a Ton80 account
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input
                type="text"
                placeholder="Enter the player's Ton80 ID"
                value={ton80Id}
                onChange={(e) => setTon80Id(e.target.value)}
                style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.9rem' }}
              />
              <button className="btn btn-primary" onClick={linkTon80} disabled={ton80Linking || !ton80Id.trim()}>
                {ton80Linking ? 'Linking...' : 'Link'}
              </button>
            </div>
            {ton80Result && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: '#dcfce7', color: '#166534', borderRadius: '0.375rem', fontSize: '0.85rem' }}>
                Linked to Ton80 player: <strong>{ton80Result}</strong>
              </div>
            )}
            {ton80Error && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: '#fef2f2', color: '#dc2626', borderRadius: '0.375rem', fontSize: '0.85rem' }}>
                {ton80Error}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setTon80Modal(null)}>
                {ton80Result ? 'Done' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
