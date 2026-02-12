import { useState, useEffect, type FormEvent } from 'react';
import api from '../../services/api';

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  venue: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  registrationDeadline: string | null;
  registrationFee: number | null;
  status: string;
  type: string | null;
  season: string | null;
}

export default function TournamentManager() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [editing, setEditing] = useState<Tournament | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', venue: '', location: '', startDate: '', endDate: '',
    registrationDeadline: '', registrationFee: '', status: 'upcoming', type: '', season: '2025-26',
  });
  const [saving, setSaving] = useState(false);
  const [resultsModal, setResultsModal] = useState<string | null>(null);
  const [results, setResults] = useState<{ category: string; placement: number; playerNames: string }[]>([]);

  const load = () => {
    api.get('/tournaments').then(({ data }) => setTournaments(data.data)).catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', venue: '', location: '', startDate: '', endDate: '', registrationDeadline: '', registrationFee: '', status: 'upcoming', type: '', season: '2025-26' });
    setEditing(null);
    setShowForm(false);
  };

  const editTournament = (t: Tournament) => {
    setForm({
      name: t.name, description: t.description || '', venue: t.venue || '', location: t.location || '',
      startDate: t.startDate?.slice(0, 10) || '', endDate: t.endDate?.slice(0, 10) || '',
      registrationDeadline: t.registrationDeadline?.slice(0, 10) || '',
      registrationFee: t.registrationFee?.toString() || '', status: t.status, type: t.type || '', season: t.season || '',
    });
    setEditing(t);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, registrationFee: form.registrationFee ? parseFloat(form.registrationFee) : null };
      if (editing) {
        await api.put(`/tournaments/${editing.id}`, payload);
      } else {
        await api.post('/tournaments', payload);
      }
      resetForm();
      load();
    } catch (err) {
      alert('Failed to save tournament');
    } finally {
      setSaving(false);
    }
  };

  const deleteTournament = async (id: string) => {
    if (!confirm('Delete this tournament and all results?')) return;
    await api.delete(`/tournaments/${id}`);
    load();
  };

  const openResults = async (id: string) => {
    setResultsModal(id);
    try {
      const { data } = await api.get(`/tournaments/${id}`);
      setResults(data.data.results.map((r: any) => ({ category: r.category, placement: r.placement, playerNames: r.playerNames })));
    } catch {
      setResults([]);
    }
  };

  const addResult = () => setResults([...results, { category: '', placement: 1, playerNames: '' }]);

  const saveResults = async () => {
    if (!resultsModal) return;
    try {
      await api.post(`/tournaments/${resultsModal}/results`, { results });
      alert('Results saved!');
      setResultsModal(null);
    } catch {
      alert('Failed to save results');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Tournaments</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ New Tournament</button>
      </div>

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>{editing ? 'Edit Tournament' : 'New Tournament'}</h2>
          <div className="admin-form-grid">
            <label>Name <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label>Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="upcoming">Upcoming</option>
                <option value="open">Registration Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label>Type
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="">Select...</option>
                <option value="zone_shoot">Zone Shoot</option>
                <option value="regional">Regional</option>
                <option value="national">National</option>
                <option value="league">League</option>
              </select>
            </label>
            <label>Season <input type="text" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} /></label>
            <label>Start Date <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required /></label>
            <label>End Date <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></label>
            <label>Registration Deadline <input type="date" value={form.registrationDeadline} onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })} /></label>
            <label>Registration Fee ($) <input type="number" step="0.01" value={form.registrationFee} onChange={(e) => setForm({ ...form, registrationFee: e.target.value })} /></label>
            <label>Venue <input type="text" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></label>
            <label>Location <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
          </div>
          <label>Description <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <div className="admin-form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      )}

      {resultsModal && (
        <div className="admin-modal-overlay" onClick={() => setResultsModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Tournament Results</h2>
            {results.map((r, i) => (
              <div key={i} className="admin-result-row">
                <input placeholder="Category (e.g. Men's Singles)" value={r.category} onChange={(e) => { const nr = [...results]; nr[i].category = e.target.value; setResults(nr); }} />
                <input type="number" min={1} placeholder="#" value={r.placement} onChange={(e) => { const nr = [...results]; nr[i].placement = parseInt(e.target.value); setResults(nr); }} style={{ width: 60 }} />
                <input placeholder="Player name(s)" value={r.playerNames} onChange={(e) => { const nr = [...results]; nr[i].playerNames = e.target.value; setResults(nr); }} />
                <button onClick={() => setResults(results.filter((_, j) => j !== i))} className="danger">×</button>
              </div>
            ))}
            <button onClick={addResult} className="btn btn-secondary">+ Add Result</button>
            <div className="admin-form-actions">
              <button onClick={saveResults} className="btn btn-primary">Save Results</button>
              <button onClick={() => setResultsModal(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      <table className="admin-table">
        <thead>
          <tr><th>Name</th><th>Date</th><th>Status</th><th>Type</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {tournaments.map((t) => (
            <tr key={t.id}>
              <td>{t.name}</td>
              <td>{new Date(t.startDate).toLocaleDateString()}</td>
              <td><span className={`admin-badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span></td>
              <td>{t.type || '—'}</td>
              <td className="admin-actions">
                <button onClick={() => editTournament(t)}>Edit</button>
                <button onClick={() => openResults(t.id)}>Results</button>
                <button onClick={() => deleteTournament(t.id)} className="danger">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
