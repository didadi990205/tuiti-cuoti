import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import MobileHeader from './components/MobileHeader'
import MobileDrawer from './components/MobileDrawer'
import LibraryPage from './pages/LibraryPage'
import UploadPage from './pages/UploadPage'
import StatsPage from './pages/StatsPage'
import NotesPage from './pages/NotesPage'
import SettingsPage from './pages/SettingsPage'
import EditPage from './pages/EditPage'
import { useIsMobile } from './hooks/useMediaQuery'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/library" replace />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/notes" element={<NotesPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/edit/:id" element={<EditPage />} />
      <Route path="*" element={<Navigate to="/library" replace />} />
    </Routes>
  )
}

function PCLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  return (
    <div className="app">
      <MobileHeader onMenuClick={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className="main-content">
        <AppRoutes />
      </main>
    </div>
  )
}

function MobileLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  return (
    <div className="app mobile-app">
      <MobileHeader onMenuClick={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className="mobile-main">
        <AppRoutes />
      </main>
    </div>
  )
}

function getBasename(): string {
  if (typeof window === 'undefined') return '/'
  const path = window.location.pathname
  if (path.endsWith('/index.html')) return path.slice(0, -'index.html'.length)
  if (path.endsWith('.html')) return path.slice(0, path.lastIndexOf('/') + 1)
  if (path.endsWith('/')) return path
  return '/'
}

export default function App() {
  const isMobile = useIsMobile()
  return (
    <BrowserRouter basename={getBasename()}>
      {isMobile ? <MobileLayout /> : <PCLayout />}
    </BrowserRouter>
  )
}
