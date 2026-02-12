import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function AnnouncementDock() {
  const [dismissed, setDismissed] = useState(false)
  const [announcement, setAnnouncement] = useState<{
    enabled: boolean; text: string; linkText: string; linkUrl: string;
  } | null>(null)

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      const a = data.data?.announcement;
      if (a?.enabled && a?.text) setAnnouncement(a);
    }).catch(() => {});
  }, [])

  if (dismissed || !announcement) return null

  const isInternal = announcement.linkUrl?.startsWith('/')

  return (
    <div className="announcement-dock">
      <div className="dock-content">
        <span className="dock-pulse" />
        <span className="dock-text">{announcement.text}</span>
        {announcement.linkText && announcement.linkUrl && (
          isInternal ? (
            <Link to={announcement.linkUrl} className="dock-cta">{announcement.linkText} &rarr;</Link>
          ) : (
            <a href={announcement.linkUrl} className="dock-cta" target="_blank" rel="noopener noreferrer">{announcement.linkText} &rarr;</a>
          )
        )}
        <button className="dock-dismiss" onClick={() => setDismissed(true)} aria-label="Dismiss">&times;</button>
      </div>
    </div>
  )
}
