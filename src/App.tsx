import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import AnnouncementDock from './components/AnnouncementDock'
import Home from './pages/Home'
import About from './pages/About'
import Tournaments from './pages/Tournaments'
import News from './pages/News'
import Forms from './pages/Forms'
import Gallery from './pages/Gallery'
import Contact from './pages/Contact'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/news" element={<News />} />
          <Route path="/forms" element={<Forms />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
      <AnnouncementDock />
    </>
  )
}
