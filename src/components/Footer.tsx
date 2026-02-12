import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-brand">
              <img src="/logo.png" alt="LDA Logo" className="footer-logo" />
              <span>Labrador Darts</span>
            </div>
            <p>The governing body for competitive and community darts across Labrador, proudly affiliated with the National Darts Federation of Canada.</p>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <Link to="/tournaments">Tournaments</Link>
            <Link to="/news">News &amp; Updates</Link>
            <Link to="/forms">Forms &amp; Documents</Link>
            <Link to="/gallery">Photo Gallery</Link>
          </div>
          <div className="footer-col">
            <h4>Association</h4>
            <Link to="/about">About the LDA</Link>
            <Link to="/contact">Contact Us</Link>
            <a href="https://www.facebook.com/share/g/1FLoEieR3q/" target="_blank" rel="noopener noreferrer">Facebook Group</a>
            <a href="https://www.ndfc.ca/page/14819/Contacts" target="_blank" rel="noopener noreferrer">NDFC Canada</a>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <p>Labrador, NL, Canada</p>
            <p>info@labradordarts.ca</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Labrador Darts Association. All rights reserved.</p>
          <p>Affiliated with NDFC Canada</p>
        </div>
      </div>
    </footer>
  )
}
