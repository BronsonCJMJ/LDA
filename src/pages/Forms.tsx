export default function Forms() {
  const documents = [
    { icon: 'PDF', title: '2026 Season Registration Form', desc: 'Required for all new and returning members to participate in sanctioned LDA events.', meta: '124 KB · Updated Jan 2026' },
    { icon: 'PDF', title: 'Score Sheet Template', desc: 'Official LDA score sheet for use during league matches and tournament play.', meta: '89 KB · Standard format' },
    { icon: 'PDF', title: 'LDA Constitutional Bylaws', desc: 'The complete bylaws and constitution of the Labrador Darts Association.', meta: '2.1 MB · Revised 2025' },
    { icon: 'PDF', title: 'Protest & Appeal Form', desc: 'For submitting formal protests or appeals regarding match results or disciplinary matters.', meta: '56 KB · Updated 2025' },
    { icon: 'PDF', title: 'NDFC Tournament Rules v2.0', desc: 'National Darts Federation of Canada official tournament rulebook. Applies to all sanctioned events.', meta: '3.4 MB · NDFC Official' },
    { icon: 'PDF', title: 'Club Affiliation Application', desc: 'Application form for new clubs wishing to affiliate with the LDA and participate in league play.', meta: '98 KB · Updated 2025' },
    { icon: 'DOC', title: 'Sponsorship Package', desc: 'Information package for businesses interested in sponsoring LDA events and the association.', meta: '1.2 MB · 2026 Season' },
    { icon: 'XLS', title: 'Standings Template', desc: 'Excel template used for tracking league standings throughout the season.', meta: '145 KB · Current format' },
  ]

  return (
    <section className="page-section">
      <div className="container">
        <div className="page-header animate-in">
          <p className="breadcrumb">Association / Forms</p>
          <h1>Forms &amp; Documents</h1>
          <p>Download official forms, templates, and documents. Contact the LDA if you need a form that isn't listed here.</p>
        </div>

        <div className="docs-grid">
          {documents.map((doc, i) => (
            <a key={i} href="#" className={`doc-card animate-in delay-${Math.min(i + 1, 5)}`}>
              <div className="doc-icon-large">{doc.icon}</div>
              <div>
                <h4>{doc.title}</h4>
                <p>{doc.desc}</p>
                <div className="doc-meta">{doc.meta}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
