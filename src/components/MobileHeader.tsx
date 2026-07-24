import { useNavigate } from 'react-router-dom'

interface Props {
  onMenuClick: () => void
}

export default function MobileHeader({ onMenuClick }: Props) {
  const navigate = useNavigate()

  return (
    <header className="mobile-header">
      <button className="mobile-menu-btn" onClick={onMenuClick} aria-label="菜单">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="mobile-logo">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#1677ff" />
          <path d="M9 11h14M9 16h14M9 21h9" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="22" cy="21" r="2" fill="#fff" />
        </svg>
        <span>行测错题</span>
      </div>

      <div className="mobile-header-actions">
        <button className="mobile-upload-btn" onClick={() => navigate('/upload')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          上传
        </button>
      </div>
    </header>
  )
}
