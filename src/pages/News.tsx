import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

interface Article {
  id: string;
  title: string;
  body: string;
  excerpt: string | null;
  tag: string;
  imageUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  author: { name: string } | null;
}

const tagLabel: Record<string, string> = { official: 'Official', deadline: 'Deadline', update: 'Update', event: 'Event' }
const tagClass = (tag: string) => {
  const map: Record<string, string> = { official: 'tag-official', deadline: 'tag-deadline', update: 'tag-update', event: 'tag-event' };
  return map[tag] || 'tag-update';
}

export default function News() {
  const [articles, setArticles] = useState<Article[]>([])
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'name'>('date-desc')
  const [filterTag, setFilterTag] = useState<string>('all')

  useEffect(() => {
    api.get('/news').then(({ data }) => setArticles(data.data.articles || [])).catch(() => {});
  }, [])

  const tags = ['all', ...new Set(articles.map(a => a.tag))]

  const filtered = articles
    .filter(a => {
      if (filterTag !== 'all' && a.tag !== filterTag) return false
      if (!search) return true
      const q = search.toLowerCase()
      return a.title.toLowerCase().includes(q) ||
        (a.excerpt || '').toLowerCase().includes(q) ||
        a.tag.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.title.localeCompare(b.title)
      if (sortBy === 'date-asc') return new Date(a.publishedAt || a.createdAt).getTime() - new Date(b.publishedAt || b.createdAt).getTime()
      return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime()
    })

  return (
    <section className="page-section">
      <div className="container">
        <div className="page-header animate-in">
          <p className="breadcrumb">Association / News</p>
          <h1>News &amp; Announcements</h1>
          <p>Stay up to date with the latest from the Labrador Darts Association.</p>
        </div>

        <div className="page-controls animate-in">
          <input
            type="text"
            className="search-input"
            placeholder="Search articles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="controls-right">
            <select className="sort-select" value={filterTag} onChange={e => setFilterTag(e.target.value)}>
              {tags.map(t => (
                <option key={t} value={t}>{t === 'all' ? 'All Tags' : tagLabel[t] || t}</option>
              ))}
            </select>
            <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name">Title (A-Z)</option>
            </select>
          </div>
        </div>

        <div className="news-page-grid">
          {filtered.map((a, i) => (
            <Link to={`/news/${a.id}`} key={a.id} className={`news-page-card animate-in delay-${Math.min(i + 1, 5)}`}>
              <div className="news-meta">
                <span className={`news-tag ${tagClass(a.tag)}`}>{tagLabel[a.tag] || a.tag}</span>
                <time>{new Date(a.publishedAt || a.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                {a.author && <span className="news-author">by {a.author.name}</span>}
              </div>
              <h2>{a.title}</h2>
              <p>{a.excerpt || stripHtml(a.body)}</p>
              <span className="news-read-more">Read full article &rarr;</span>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="empty-state">{search || filterTag !== 'all' ? 'No articles match your search.' : 'No news articles yet. Check back soon.'}</p>
          )}
        </div>
      </div>
    </section>
  )
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  const text = tmp.textContent || tmp.innerText || ''
  return text.length > 200 ? text.slice(0, 200) + '...' : text
}
