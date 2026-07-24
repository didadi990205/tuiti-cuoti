import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from './Sidebar'

interface Props {
  onMenuClick: () => void
}

// 移动端顶部导航：汉堡 + Logo + 名称 + 折叠搜索 + 上传按钮
export default function MobileHeader({ onMenuClick }: Props) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/library?q=${encodeURIComponent(keyword)}`)
    setSearchOpen(false)
    setKeyword('')
  }

  return (
    <>
      <header className="mobile-header">
        <button className="mobile-menu-btn" onClick={onMenuClick} aria-label="菜单">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="mobile-logo">
          {Icon.logo}
          <span>图推错题</span>
        </div>

        <div className="mobile-header-actions">
          <button className="mobile-icon-btn" onClick={() => setSearchOpen(true)} aria-label="搜索">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button className="mobile-upload-btn" onClick={() => navigate('/upload')}>
            上传新题
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="mobile-search-overlay" onClick={() => setSearchOpen(false)}>
          <form className="mobile-search-bar" onClick={e => e.stopPropagation()} onSubmit={handleSearch}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              autoFocus
              type="text"
              placeholder="搜索错题备注..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
            <button type="button" className="mobile-search-cancel" onClick={() => setSearchOpen(false)}>
              取消
            </button>
          </form>
        </div>
      )}
    </>
  )
}
