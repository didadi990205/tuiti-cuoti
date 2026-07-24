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

// PC布局
function PCLayout() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main-content">
        <AppRoutes />
      </main>
    </div>
  )
}

// 移动端布局
function MobileLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  // 路由切换时关闭抽屉
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

// 计算部署basename：支持子路径部署（如 username.gitee.io/tuiti-cuoti/）
// 通过相对base构建，所有资源用相对路径，路由basename需要根据实际访问路径推断
function getBasename(): string {
  if (typeof window === 'undefined') return '/'
  // 解析 <base> 或从 location.pathname 推断
  // Vite base:'./' 时 index.html 中的资源是相对路径，无需basename处理资源
  // 路由 basename 取当前路径去掉 hash/search 后的非文件段
  const path = window.location.pathname
  // 若以 index.html 结尾，取其目录
  if (path.endsWith('/index.html')) return path.slice(0, -'index.html'.length)
  if (path.endsWith('.html')) return path.slice(0, path.lastIndexOf('/') + 1)
  // 若以 / 结尾，即为根
  if (path.endsWith('/')) return path
  // 否则可能是子路径部署的根（如 /tuiti-cuoti）
  // 此处保守返回 '/'，由404.html脚本处理的replaceState已修正
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
