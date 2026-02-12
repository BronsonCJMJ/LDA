import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function AnnouncementDock() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="announcement-dock">
      <div className="dock-content">
        <span className="dock-pulse" />
        <span className="dock-text">2026 Season Registration Open</span>
        <Link to="/forms" className="dock-cta">Register Now &rarr;</Link>
        <button
          className="dock-dismiss"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          &times;
        </button>
      </div>
    </div>
  )
}
