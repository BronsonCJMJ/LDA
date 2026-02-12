import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
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

export default function NewsDetail() {
  const { id } = useParams()
  const [article, setArticle] = useState<Article | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (id) {
      api.get(`/news/${id}`)
        .then(({ data }) => setArticle(data.data))
        .catch(() => setError(true));
    }
  }, [id])

  if (error) {
    return (
      <section className="page-section">
        <div className="container">
          <div className="page-header animate-in">
            <p className="breadcrumb"><Link to="/news">News</Link> / Not Found</p>
            <h1>Article Not Found</h1>
            <p>This article may have been removed or is no longer available.</p>
          </div>
          <Link to="/news" className="btn btn-secondary">&larr; Back to News</Link>
        </div>
      </section>
    )
  }

  if (!article) {
    return (
      <section className="page-section">
        <div className="container"><p>Loading...</p></div>
      </section>
    )
  }

  const date = new Date(article.publishedAt || article.createdAt)

  return (
    <section className="page-section">
      <div className="container">
        <div className="page-header animate-in">
          <p className="breadcrumb"><Link to="/news">News</Link> / {article.title}</p>
          <div className="news-detail-meta">
            <span className={`news-tag ${tagClass(article.tag)}`}>{tagLabel[article.tag] || article.tag}</span>
            <time>{date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</time>
            {article.author && <span className="news-detail-author">by {article.author.name}</span>}
          </div>
          <h1>{article.title}</h1>
        </div>

        {article.imageUrl && (
          <div className="news-detail-image animate-in delay-1">
            <img src={article.imageUrl} alt={article.title} />
          </div>
        )}

        <article
          className="news-detail-body animate-in delay-2"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />

        <div style={{ marginTop: '2rem' }} className="animate-in delay-3">
          <Link to="/news" className="btn btn-secondary">&larr; Back to News</Link>
        </div>
      </div>
    </section>
  )
}
