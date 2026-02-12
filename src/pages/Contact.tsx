import { useState } from 'react'

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <section className="page-section">
      <div className="container">
        <div className="page-header animate-in">
          <p className="breadcrumb">Association / Contact</p>
          <h1>Contact Us</h1>
          <p>Have a question about the LDA, tournaments, or membership? Get in touch.</p>
        </div>

        <div className="contact-grid">
          <div className="contact-form animate-in delay-1">
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <h3 style={{ color: 'var(--green-700)', marginBottom: '0.5rem' }}>Message Sent</h3>
                <p>Thank you for reaching out. We'll get back to you as soon as possible.</p>
                <button className="btn btn-primary" onClick={() => setSubmitted(false)} style={{ marginTop: '1rem' }}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input type="text" id="name" placeholder="Your name" required />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input type="email" id="email" placeholder="you@example.com" required />
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <select id="subject" required>
                    <option value="">Select a subject...</option>
                    <option value="membership">Membership Inquiry</option>
                    <option value="tournament">Tournament Information</option>
                    <option value="sponsorship">Sponsorship</option>
                    <option value="general">General Question</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" placeholder="How can we help?" required />
                </div>
                <button type="submit" className="btn btn-primary">Send Message</button>
              </form>
            )}
          </div>

          <div className="contact-info-cards animate-in delay-2">
            <div className="contact-info-card">
              <h4>Email</h4>
              <p><a href="mailto:info@labradordarts.ca">info@labradordarts.ca</a></p>
            </div>
            <div className="contact-info-card">
              <h4>Facebook</h4>
              <p>Join our <a href="https://www.facebook.com/share/g/1FLoEieR3q/" target="_blank" rel="noopener noreferrer">Facebook Group</a> for community discussion and real-time updates.</p>
            </div>
            <div className="contact-info-card">
              <h4>Location</h4>
              <p>Labrador, Newfoundland and Labrador, Canada</p>
            </div>
            <div className="contact-info-card">
              <h4>NDFC Affiliation</h4>
              <p>For national inquiries, contact the <a href="#" target="_blank" rel="noopener noreferrer">National Darts Federation of Canada</a>.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
