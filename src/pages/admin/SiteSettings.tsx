import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

interface BoardMember {
  name: string;
  title: string;
  initials: string;
  bio: string;
  photo: string;      // GCS object path or static path
  photoUrl?: string;   // resolved signed URL (transient, from API)
}

export default function SiteSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Track whether API key was edited (so we don't overwrite with the masked version)
  const [apiKeyEdited, setApiKeyEdited] = useState(false);

  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

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

  const boardMembers: BoardMember[] = settings.boardMembers || [];

  const updateMember = (index: number, field: string, value: string) => {
    const bm = [...boardMembers];
    bm[index] = { ...bm[index], [field]: value };
    update('boardMembers', bm);
  };

  const removeMember = (index: number) => {
    update('boardMembers', boardMembers.filter((_, j) => j !== index));
  };

  const addMember = () => {
    update('boardMembers', [...boardMembers, { name: '', title: '', initials: '', bio: '', photo: '' }]);
  };

  const moveMember = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= boardMembers.length) return;
    const bm = [...boardMembers];
    [bm[index], bm[newIndex]] = [bm[newIndex], bm[index]];
    update('boardMembers', bm);
  };

  const uploadPhoto = async (index: number, file: File) => {
    setUploadingIndex(index);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('index', String(index));
      const { data } = await api.post('/settings/board-member-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success) {
        const bm = [...boardMembers];
        bm[index] = { ...bm[index], photo: data.data.photo, photoUrl: data.data.photoUrl };
        update('boardMembers', bm);
      }
    } catch (err) {
      console.error('Photo upload failed:', err);
      setMessage('Photo upload failed');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setUploadingIndex(null);
    }
  };

  const getPhotoSrc = (m: BoardMember): string | null => {
    // Prefer resolved signed URL from API
    if (m.photoUrl) return m.photoUrl;
    // Static paths work directly
    if (m.photo?.startsWith('/')) return m.photo;
    return null;
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
  const liveBanner = settings.liveBanner || { enabled: false, title: '', subtitle: '', linkUrl: '' };
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
        <h2>Live Event Banner</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Display a prominent banner on the homepage for live events (e.g. DartConnect live scores).
        </p>
        <label className="admin-checkbox">
          <input type="checkbox" checked={liveBanner.enabled} onChange={(e) => update('liveBanner', { ...liveBanner, enabled: e.target.checked })} />
          Show live event banner
        </label>
        <div className="admin-form-grid">
          <label>Title <input type="text" value={liveBanner.title} onChange={(e) => update('liveBanner', { ...liveBanner, title: e.target.value })} placeholder="e.g. LDA Provincial Championships 2026" /></label>
          <label>Subtitle <input type="text" value={liveBanner.subtitle} onChange={(e) => update('liveBanner', { ...liveBanner, subtitle: e.target.value })} placeholder="e.g. Watch live scores on DartConnect TV" /></label>
          <label>Link URL <input type="text" value={liveBanner.linkUrl} onChange={(e) => update('liveBanner', { ...liveBanner, linkUrl: e.target.value })} placeholder="e.g. https://tv.dartconnect.com/event/ldaprovincial26" /></label>
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
        <h2>Executive Board Members</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Manage the executive board displayed on the About page. Use the arrows to reorder members.
        </p>
        {boardMembers.map((m, i) => {
          const photoSrc = getPhotoSrc(m);
          return (
            <div key={i} className="board-member-card">
              <div className="board-member-card-header">
                <div className="board-member-card-order">
                  <button
                    className="btn-icon"
                    onClick={() => moveMember(i, -1)}
                    disabled={i === 0}
                    title="Move up"
                  >&#9650;</button>
                  <span className="board-member-card-num">{i + 1}</span>
                  <button
                    className="btn-icon"
                    onClick={() => moveMember(i, 1)}
                    disabled={i === boardMembers.length - 1}
                    title="Move down"
                  >&#9660;</button>
                </div>

                <div className="board-member-card-photo">
                  {uploadingIndex === i ? (
                    <div className="board-member-card-photo-placeholder">
                      <span className="admin-spinner-small" />
                    </div>
                  ) : photoSrc ? (
                    <img src={photoSrc} alt={m.name} />
                  ) : (
                    <div className="board-member-card-photo-placeholder">
                      {m.initials || m.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <input
                    ref={(el) => { fileInputRefs.current[i] = el; }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadPhoto(i, file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => fileInputRefs.current[i]?.click()}
                    disabled={uploadingIndex === i}
                  >
                    {photoSrc ? 'Change Photo' : 'Upload Photo'}
                  </button>
                </div>

                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => removeMember(i)}
                  title="Remove member"
                >Remove</button>
              </div>

              <div className="admin-form-grid">
                <label>Name <input type="text" value={m.name} onChange={(e) => updateMember(i, 'name', e.target.value)} /></label>
                <label>Title / Role <input type="text" value={m.title} onChange={(e) => updateMember(i, 'title', e.target.value)} /></label>
                <label>Initials <input type="text" value={m.initials} maxLength={3} onChange={(e) => updateMember(i, 'initials', e.target.value)} /></label>
              </div>
              <label style={{ marginTop: '0.5rem', display: 'block' }}>
                Bio
                <textarea rows={2} value={m.bio || ''} onChange={(e) => updateMember(i, 'bio', e.target.value)} placeholder="Short bio for the About page (optional)" />
              </label>
            </div>
          );
        })}
        <button className="btn btn-secondary" onClick={addMember} style={{ marginTop: '0.5rem' }}>+ Add Board Member</button>
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
