import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function SiteSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Track whether API key was edited (so we don't overwrite with the masked version)
  const [apiKeyEdited, setApiKeyEdited] = useState(false);

  useEffect(() => {
    // Admin endpoint includes sensitive settings (with API key masked)
    api.get('/settings/all').then(({ data }) => setSettings(data.data)).catch(console.error);
  }, []);

  const update = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...settings };
      // Don't send the masked API key back — only send if admin typed a new one
      if (payload.ton80 && !apiKeyEdited) {
        const { apiKey: _stripped, ...rest } = payload.ton80;
        payload.ton80 = rest;
      }
      await api.put('/settings', payload);
      setMessage('Settings saved!');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const ton80 = settings.ton80 || { apiUrl: 'https://ton80.ca/api/v1', apiKey: '', orgSlug: '' };

  const testTon80Connection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    try {
      const res = await api.post('/settings/test-ton80', {
        apiUrl: ton80.apiUrl,
        apiKey: ton80.apiKey,
        orgSlug: ton80.orgSlug,
      });
      setConnectionResult({ ok: true, message: res.data.message || 'Connection successful!' });
    } catch (err: any) {
      setConnectionResult({ ok: false, message: err?.response?.data?.error?.message || err?.response?.data?.message || 'Connection failed' });
    } finally {
      setTestingConnection(false);
    }
  };

  const announcement = settings.announcement || { enabled: true, text: '', linkText: '', linkUrl: '' };
  const stats = settings.stats || { nextTournament: { label: '', value: '', description: '' }, activeMembers: { label: '', value: '', description: '' }, currentSeason: { label: '', value: '', description: '' } };
  const heroText = settings.heroText || { eyebrow: '', title: '', subtitle: '' };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Site Settings</h1>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      {message && <div className="admin-success">{message}</div>}

      <section className="admin-settings-section">
        <h2>Announcement Dock</h2>
        <label className="admin-checkbox">
          <input type="checkbox" checked={announcement.enabled} onChange={(e) => update('announcement', { ...announcement, enabled: e.target.checked })} />
          Show announcement dock
        </label>
        <div className="admin-form-grid">
          <label>Text <input type="text" value={announcement.text} onChange={(e) => update('announcement', { ...announcement, text: e.target.value })} /></label>
          <label>Link Text <input type="text" value={announcement.linkText} onChange={(e) => update('announcement', { ...announcement, linkText: e.target.value })} /></label>
          <label>Link URL <input type="text" value={announcement.linkUrl} onChange={(e) => update('announcement', { ...announcement, linkUrl: e.target.value })} /></label>
        </div>
      </section>

      <section className="admin-settings-section">
        <h2>Hero Section</h2>
        <div className="admin-form-grid">
          <label>Eyebrow Text <input type="text" value={heroText.eyebrow} onChange={(e) => update('heroText', { ...heroText, eyebrow: e.target.value })} /></label>
          <label>Title <input type="text" value={heroText.title} onChange={(e) => update('heroText', { ...heroText, title: e.target.value })} /></label>
        </div>
        <label>Subtitle <textarea rows={2} value={heroText.subtitle} onChange={(e) => update('heroText', { ...heroText, subtitle: e.target.value })} /></label>
      </section>

      <section className="admin-settings-section">
        <h2>Homepage Stat Cards</h2>
        {['nextTournament', 'activeMembers', 'currentSeason'].map((key) => {
          const stat = stats[key] || { label: '', value: '', description: '' };
          return (
            <div key={key} className="admin-form-grid" style={{ marginBottom: '1rem' }}>
              <label>{key} — Label <input type="text" value={stat.label} onChange={(e) => update('stats', { ...stats, [key]: { ...stat, label: e.target.value } })} /></label>
              <label>Value <input type="text" value={stat.value} onChange={(e) => update('stats', { ...stats, [key]: { ...stat, value: e.target.value } })} /></label>
              <label>Description <input type="text" value={stat.description} onChange={(e) => update('stats', { ...stats, [key]: { ...stat, description: e.target.value } })} /></label>
            </div>
          );
        })}
      </section>

      <section className="admin-settings-section">
        <h2>Board Members</h2>
        {(settings.boardMembers || []).map((m: any, i: number) => (
          <div key={i} className="admin-form-grid" style={{ marginBottom: '0.5rem' }}>
            <label>Name <input type="text" value={m.name} onChange={(e) => {
              const bm = [...(settings.boardMembers || [])];
              bm[i] = { ...bm[i], name: e.target.value };
              update('boardMembers', bm);
            }} /></label>
            <label>Title <input type="text" value={m.title} onChange={(e) => {
              const bm = [...(settings.boardMembers || [])];
              bm[i] = { ...bm[i], title: e.target.value };
              update('boardMembers', bm);
            }} /></label>
            <label>Initials <input type="text" value={m.initials} onChange={(e) => {
              const bm = [...(settings.boardMembers || [])];
              bm[i] = { ...bm[i], initials: e.target.value };
              update('boardMembers', bm);
            }} /></label>
            <button onClick={() => update('boardMembers', (settings.boardMembers || []).filter((_: any, j: number) => j !== i))} className="btn btn-secondary">Remove</button>
          </div>
        ))}
        <button className="btn btn-secondary" onClick={() => update('boardMembers', [...(settings.boardMembers || []), { name: '', title: '', initials: '' }])}>+ Add Board Member</button>
      </section>

      <section className="admin-settings-section">
        <h2>Ton80 Integration</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Connect to the Ton80 darts platform to pull player stats and link members to their Ton80 profiles.
        </p>
        <div className="admin-form-grid">
          <label>API URL <input type="text" value={ton80.apiUrl} onChange={(e) => update('ton80', { ...ton80, apiUrl: e.target.value })} placeholder="https://ton80.ca/api/v1" /></label>
          <label>API Key <input type="password" value={ton80.apiKey} onChange={(e) => { setApiKeyEdited(true); update('ton80', { ...ton80, apiKey: e.target.value }); }} placeholder="ton80_xxxxxxxxxxxx" /></label>
          <label>Organization Slug <input type="text" value={ton80.orgSlug} onChange={(e) => update('ton80', { ...ton80, orgSlug: e.target.value })} placeholder="e.g. labrador-darts" /></label>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="btn btn-secondary"
            onClick={testTon80Connection}
            disabled={testingConnection || !ton80.apiUrl}
          >
            {testingConnection ? 'Testing...' : 'Test Connection'}
          </button>
          {connectionResult && (
            <span style={{ color: connectionResult.ok ? 'var(--color-success, #22c55e)' : 'var(--color-error, #ef4444)', fontSize: '0.9rem', fontWeight: 500 }}>
              {connectionResult.message}
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
