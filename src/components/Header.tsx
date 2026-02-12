import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/tournaments', label: 'Tournaments' },
  { path: '/news', label: 'News' },
  { path: '/forms', label: 'Forms' },
  { path: '/gallery', label: 'Gallery' },
  { path: '/contact', label: 'Contact' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <img src="/logo.png" alt="LDA Logo" className="brand-logo" />
          <span>Labrador Darts</span>
        </Link>

        <button
          className={`menu-toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>

        <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${pathname === link.path ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
