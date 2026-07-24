import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useStore } from '@/hooks/useStore'
import CategoryTree from './CategoryTree'
import { Icon } from './Sidebar'

interface Props {
  open: boolean
  onClose: () => void
}

export default function MobileDrawer({ open, onClose }: Props) {
  const data = useStore()
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [keyword, setKeyword] = useState('')

  if (!open) return null

  // 点击分类：跳转题库并筛选
  const toggleCategory = (id: string) => {
    const next = selectedCats.includes(id)
      ? selectedCats.filter(c => c !== id)
      : [...selectedCats, id]
    setSelectedCats(next)
    // 立即触发筛选：将选择存入 sessionStorage
    sessionStorage.setItem('pending-filter', JSON.stringify(next))
    onClose()
    window.location.href = '/library'
  }

  // 顶部搜索
  const handleSearch = () => {
    if (!keyword.trim()) return
    sessionStorage.setItem('pending-search', keyword.trim())
    onClose()
    window.location.href = '/library'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="mobile-drawer-overlay" onClick={onClose}>
      <aside className="mobile-drawer" onClick={e => e.stopPropagation()}>
        <div className="mobile-drawer-header">
          <div className="mobile-drawer-brand">
            {Icon.logo}
            <span>行测错题复盘</span>
          </div>
          <button className="mobile-drawer-close" onClick={onClose} aria-label="关闭">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="mobile-drawer-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="搜索错题备注..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <nav className="mobile-drawer-nav">
          <NavLink to="/library" className={({ isActive }) => `mobile-drawer-link${isActive ? ' active' : ''}`} onClick={onClose}>
            <span className="mobile-drawer-icon">{Icon.library}</span>
            <span>错题题库</span>
          </NavLink>
          <NavLink to="/upload" className={({ isActive }) => `mobile-drawer-link${isActive ? ' active' : ''}`} onClick={onClose}>
            <span className="mobile-drawer-icon">{Icon.upload}</span>
            <span>上传题目</span>
          </NavLink>
          <NavLink to="/stats" className={({ isActive }) => `mobile-drawer-link${isActive ? ' active' : ''}`} onClick={onClose}>
            <span className="mobile-drawer-icon">{Icon.stats}</span>
            <span>统计看板</span>
          </NavLink>
          <NavLink to="/notes" className={({ isActive }) => `mobile-drawer-link${isActive ? ' active' : ''}`} onClick={onClose}>
            <span className="mobile-drawer-icon">{Icon.notes}</span>
            <span>知识点</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `mobile-drawer-link${isActive ? ' active' : ''}`} onClick={onClose}>
            <span className="mobile-drawer-icon">{Icon.settings}</span>
            <span>设置</span>
          </NavLink>
        </nav>

        <div className="mobile-drawer-divider" />

        <div className="mobile-drawer-cats">
          <div className="mobile-drawer-cats-title">按分类筛选</div>
          {data.categories.length === 0 ? (
            <div className="mobile-drawer-empty-cat">暂无分类</div>
          ) : (
            <CategoryTree
              categories={data.categories}
              selected={selectedCats}
              onToggle={toggleCategory}
            />
          )}
        </div>
      </aside>
    </div>
  )
}
