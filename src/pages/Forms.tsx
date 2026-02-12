import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'

interface Doc {
  id: string; title: string; description: string | null; fileType: string; fileSize: number | null; category: string;
}

type FormView = 'documents' | 'registration' | 'protest' | 'club_affiliation'

export default function Forms() {
  const [searchParams] = useSearchParams()
  const [documents, setDocuments] = useState<Doc[]>([])
  const initialTab = (searchParams.get('tab') as FormView) || 'documents'
  const [activeView, setActiveView] = useState<FormView>(initialTab)
  const [submitted, setSubmitted] = useState(false)
  const [docSearch, setDocSearch] = useState('')
  const [docSort, setDocSort] = useState<'default' | 'name' | 'category'>('default')

  useEffect(() => {
    api.get('/documents').then(({ data }) => setDocuments(data.data || [])).catch(() => {});
  }, [])

  // Update tab when URL query changes (e.g. from deadline link)
  useEffect(() => {
    const tab = searchParams.get('tab') as FormView
    if (tab && ['documents', 'registration', 'protest', 'club_affiliation'].includes(tab)) {
      setActiveView(tab)
      setSubmitted(false)
    }
  }, [searchParams])

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const downloadDoc = async (id: string) => {
    try {
      const { data } = await api.get(`/documents/${id}/download`);
      window.open(data.data.downloadUrl, '_blank');
    } catch {
      alert('Download failed');
    }
  }

  return (
    <section className="page-section">
      <div className="container">
        <div className="page-header animate-in">
          <p className="breadcrumb">Association / Forms</p>
          <h1>Forms &amp; Documents</h1>
          <p>Download official documents or fill out forms directly online. Registration, protest/appeal, and club affiliation forms can be submitted right here.</p>
        </div>

        <div className="forms-nav animate-in">
          <button className={`forms-nav-btn ${activeView === 'documents' ? 'active' : ''}`} onClick={() => { setActiveView('documents'); setSubmitted(false); }}>
            Documents &amp; Downloads
          </button>
          <button className={`forms-nav-btn ${activeView === 'registration' ? 'active' : ''}`} onClick={() => { setActiveView('registration'); setSubmitted(false); }}>
            Member Registration
          </button>
          <button className={`forms-nav-btn ${activeView === 'protest' ? 'active' : ''}`} onClick={() => { setActiveView('protest'); setSubmitted(false); }}>
            Protest &amp; Appeal
          </button>
          <button className={`forms-nav-btn ${activeView === 'club_affiliation' ? 'active' : ''}`} onClick={() => { setActiveView('club_affiliation'); setSubmitted(false); }}>
            Club Affiliation
          </button>
        </div>

        {activeView === 'documents' && (
          <>
            <div className="page-controls animate-in" style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                className="search-input"
                placeholder="Search documents..."
                value={docSearch}
                onChange={e => setDocSearch(e.target.value)}
              />
              <div className="controls-right">
                <select className="sort-select" value={docSort} onChange={e => setDocSort(e.target.value as any)}>
                  <option value="default">Default Order</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="category">Category</option>
                </select>
              </div>
            </div>
            <div className="docs-grid animate-in">
              {documents
                .filter(doc => {
                  if (!docSearch) return true
                  const q = docSearch.toLowerCase()
                  return doc.title.toLowerCase().includes(q) ||
                    (doc.description || '').toLowerCase().includes(q) ||
                    doc.category.toLowerCase().includes(q)
                })
                .sort((a, b) => {
                  if (docSort === 'name') return a.title.localeCompare(b.title)
                  if (docSort === 'category') return a.category.localeCompare(b.category)
                  return 0
                })
                .map((doc, i) => (
                <button key={doc.id} className={`doc-card animate-in delay-${Math.min(i + 1, 5)}`} onClick={() => downloadDoc(doc.id)}>
                  <div className="doc-icon-large">{doc.fileType.toUpperCase()}</div>
                  <div>
                    <h4>{doc.title}</h4>
                    {doc.description && <p>{doc.description}</p>}
                    <div className="doc-meta">{formatSize(doc.fileSize)}{doc.category !== 'general' ? ` \u00b7 ${doc.category}` : ''}</div>
                  </div>
                </button>
              ))}
              {documents.length === 0 && <p className="empty-state">No documents available yet.</p>}
            </div>
          </>
        )}

        {activeView === 'registration' && (
          submitted ? <SubmissionSuccess onReset={() => setSubmitted(false)} /> :
          <RegistrationForm onSuccess={() => setSubmitted(true)} />
        )}

        {activeView === 'protest' && (
          submitted ? <SubmissionSuccess onReset={() => setSubmitted(false)} /> :
          <ProtestForm onSuccess={() => setSubmitted(true)} />
        )}

        {activeView === 'club_affiliation' && (
          submitted ? <SubmissionSuccess onReset={() => setSubmitted(false)} /> :
          <ClubAffiliationForm onSuccess={() => setSubmitted(true)} />
        )}
      </div>
    </section>
  )
}

function SubmissionSuccess({ onReset }: { onReset: () => void }) {
  return (
    <div className="submission-success animate-in">
      <div className="success-icon">&#10003;</div>
      <h2>Form Submitted Successfully</h2>
      <p>Thank you for your submission. The LDA executive will review it and get back to you shortly.</p>
      <button className="btn btn-primary" onClick={onReset}>Submit Another Form</button>
    </div>
  )
}

function RegistrationForm({ onSuccess }: { onSuccess: () => void }) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const idRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    legalName: '', sex: '', mailingAddress: '', phone: '', email: '', dob: '',
    mcpNumber: '', membershipType: 'adult', agreement: false,
  })
  const u = (field: string, value: string | boolean) => setForm({ ...form, [field]: value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.agreement) { setError('You must agree to the terms'); return }
    setSending(true); setError('')
    try {
      const fd = new FormData()
      fd.append('formType', 'registration')
      fd.append('name', form.legalName)
      fd.append('email', form.email)
      fd.append('data', JSON.stringify({
        legalName: form.legalName, sex: form.sex, mailingAddress: form.mailingAddress,
        phone: form.phone, dob: form.dob, mcpNumber: form.mcpNumber,
        membershipType: form.membershipType,
      }))
      const file = idRef.current?.files?.[0]
      if (file) fd.append('idDocument', file)
      await api.post('/forms/submit', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onSuccess()
    } catch {
      setError('Submission failed. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="online-form animate-in">
      <div className="form-header">
        <h2>2025-2026 Season Registration</h2>
        <p>Fill out and submit your registration form online. Payment is made separately via EMT.</p>
      </div>

      <div className="form-notice">
        <strong>Payment Instructions:</strong> After submitting this form, send your membership fee via e-Transfer to <strong>labradordarts23@gmail.com</strong>.
        Adult membership: $60 | Youth membership: $20.
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="reg-name">Legal Name *</label>
            <input id="reg-name" type="text" value={form.legalName} onChange={e => u('legalName', e.target.value)} required placeholder="Full legal name" />
          </div>
          <div className="form-group">
            <label htmlFor="reg-sex">Sex *</label>
            <select id="reg-sex" value={form.sex} onChange={e => u('sex', e.target.value)} required>
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="reg-address">Mailing Address *</label>
          <input id="reg-address" type="text" value={form.mailingAddress} onChange={e => u('mailingAddress', e.target.value)} required placeholder="Full mailing address" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="reg-phone">Phone Number *</label>
            <input id="reg-phone" type="tel" value={form.phone} onChange={e => u('phone', e.target.value)} required placeholder="(709) 555-1234" />
          </div>
          <div className="form-group">
            <label htmlFor="reg-email">Email Address *</label>
            <input id="reg-email" type="email" value={form.email} onChange={e => u('email', e.target.value)} required placeholder="you@example.com" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="reg-dob">Date of Birth *</label>
            <input id="reg-dob" type="date" value={form.dob} onChange={e => u('dob', e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="reg-mcp">MCP Number *</label>
            <input id="reg-mcp" type="text" value={form.mcpNumber} onChange={e => u('mcpNumber', e.target.value)} required placeholder="MCP number" />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="reg-type">Membership Type *</label>
          <select id="reg-type" value={form.membershipType} onChange={e => u('membershipType', e.target.value)} required>
            <option value="adult">Adult ($60)</option>
            <option value="youth">Youth ($20)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="reg-id">Photo ID *</label>
          <input ref={idRef} id="reg-id" type="file" accept="image/*,.pdf" required />
          <span className="form-help">Upload a clear photo of your government-issued ID.</span>
        </div>

        <label className="form-checkbox">
          <input type="checkbox" checked={form.agreement} onChange={e => u('agreement', e.target.checked)} />
          I certify that the information above is accurate and I agree to the LDA bylaws and code of conduct.
        </label>

        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? 'Submitting...' : 'Submit Registration'}
        </button>
      </form>
    </div>
  )
}

function ProtestForm({ onSuccess }: { onSuccess: () => void }) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', tournament: '', date: '', category: '', description: '' })
  const u = (field: string, value: string) => setForm({ ...form, [field]: value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSending(true); setError('')
    try {
      await api.post('/forms/submit', {
        formType: 'protest_appeal', name: form.name, email: form.email,
        data: { tournament: form.tournament, dateOfIncident: form.date, category: form.category, description: form.description },
      })
      onSuccess()
    } catch {
      setError('Submission failed. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="online-form animate-in">
      <div className="form-header">
        <h2>Protest &amp; Appeal Form</h2>
        <p>Submit a formal protest or appeal regarding match results or disciplinary matters.</p>
      </div>
      <form onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="pa-name">Your Name *</label>
            <input id="pa-name" type="text" value={form.name} onChange={e => u('name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="pa-email">Email *</label>
            <input id="pa-email" type="email" value={form.email} onChange={e => u('email', e.target.value)} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="pa-tournament">Tournament / Event *</label>
            <input id="pa-tournament" type="text" value={form.tournament} onChange={e => u('tournament', e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="pa-date">Date of Incident *</label>
            <input id="pa-date" type="date" value={form.date} onChange={e => u('date', e.target.value)} required />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="pa-cat">Category</label>
          <input id="pa-cat" type="text" value={form.category} onChange={e => u('category', e.target.value)} placeholder="e.g. Men's Singles, Mixed Doubles" />
        </div>
        <div className="form-group">
          <label htmlFor="pa-desc">Description of Protest / Appeal *</label>
          <textarea id="pa-desc" rows={5} value={form.description} onChange={e => u('description', e.target.value)} required placeholder="Provide full details of the incident and grounds for your protest or appeal." />
        </div>
        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? 'Submitting...' : 'Submit Protest / Appeal'}
        </button>
      </form>
    </div>
  )
}

function ClubAffiliationForm({ onSuccess }: { onSuccess: () => void }) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ clubName: '', contactName: '', email: '', phone: '', location: '', memberCount: '', description: '' })
  const u = (field: string, value: string) => setForm({ ...form, [field]: value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSending(true); setError('')
    try {
      await api.post('/forms/submit', {
        formType: 'club_affiliation', name: form.contactName, email: form.email,
        data: { clubName: form.clubName, contactName: form.contactName, phone: form.phone, location: form.location, memberCount: form.memberCount, description: form.description },
      })
      onSuccess()
    } catch {
      setError('Submission failed. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="online-form animate-in">
      <div className="form-header">
        <h2>Club Affiliation Application</h2>
        <p>Apply for your club to become an affiliated member of the Labrador Darts Association.</p>
      </div>
      <form onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ca-club">Club Name *</label>
            <input id="ca-club" type="text" value={form.clubName} onChange={e => u('clubName', e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="ca-contact">Contact Person *</label>
            <input id="ca-contact" type="text" value={form.contactName} onChange={e => u('contactName', e.target.value)} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ca-email">Email *</label>
            <input id="ca-email" type="email" value={form.email} onChange={e => u('email', e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="ca-phone">Phone</label>
            <input id="ca-phone" type="tel" value={form.phone} onChange={e => u('phone', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ca-loc">Location *</label>
            <input id="ca-loc" type="text" value={form.location} onChange={e => u('location', e.target.value)} required placeholder="City / community" />
          </div>
          <div className="form-group">
            <label htmlFor="ca-members">Approximate Member Count</label>
            <input id="ca-members" type="number" value={form.memberCount} onChange={e => u('memberCount', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="ca-desc">Additional Information</label>
          <textarea id="ca-desc" rows={4} value={form.description} onChange={e => u('description', e.target.value)} placeholder="Tell us about your club, facilities, and experience." />
        </div>
        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  )
}
