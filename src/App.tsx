import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import Header from './components/Header'
import Footer from './components/Footer'
import AnnouncementDock from './components/AnnouncementDock'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import About from './pages/About'
import Tournaments from './pages/Tournaments'
import News from './pages/News'
import NewsDetail from './pages/NewsDetail'
import Forms from './pages/Forms'
import Gallery from './pages/Gallery'
import GalleryAlbum from './pages/GalleryAlbum'
import TournamentDetail from './pages/TournamentDetail'
import Contact from './pages/Contact'
const MemberProfile = lazy(() => import('./pages/MemberProfile'))
import AdminLogin from './pages/admin/AdminLogin'
import Dashboard from './pages/admin/Dashboard'
import NewsManager from './pages/admin/NewsManager'
import TournamentManager from './pages/admin/TournamentManager'
import MemberManager from './pages/admin/MemberManager'
import GalleryManager from './pages/admin/GalleryManager'
import DocumentManager from './pages/admin/DocumentManager'
import FormSubmissions from './pages/admin/FormSubmissions'
import SiteSettings from './pages/admin/SiteSettings'
import Analytics from './pages/admin/Analytics'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <AnnouncementDock />
    </>
  )
}

function PageViewTracker() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (!pathname.startsWith('/admin')) {
      fetch('/api/pageviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: pathname }),
      }).catch(() => {})
    }
  }, [pathname])
  return null
}

export default function App() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <AuthProvider>
      <ScrollToTop />
      <PageViewTracker />
      {isAdmin ? (
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/news" element={<ProtectedRoute><NewsManager /></ProtectedRoute>} />
          <Route path="/admin/tournaments" element={<ProtectedRoute><TournamentManager /></ProtectedRoute>} />
          <Route path="/admin/members" element={<ProtectedRoute><MemberManager /></ProtectedRoute>} />
          <Route path="/admin/gallery" element={<ProtectedRoute><GalleryManager /></ProtectedRoute>} />
          <Route path="/admin/documents" element={<ProtectedRoute><DocumentManager /></ProtectedRoute>} />
          <Route path="/admin/forms" element={<ProtectedRoute><FormSubmissions /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><SiteSettings /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        </Routes>
      ) : (
        <PublicLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournaments/:id" element={<TournamentDetail />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            <Route path="/forms" element={<Forms />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/gallery/:id" element={<GalleryAlbum />} />
            <Route path="/members/:id" element={<Suspense fallback={<div className="page-section"><div className="container"><p>Loading...</p></div></div>}><MemberProfile /></Suspense>} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </PublicLayout>
      )}
    </AuthProvider>
  )
}
