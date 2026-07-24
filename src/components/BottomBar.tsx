import { useNavigate, useLocation } from 'react-router-dom'

// 底部全局操作栏：返回、前进、分享、主页
export default function BottomBar() {
  const navigate = useNavigate()
  const location = useLocation()

  const canGoBack = location.key !== 'default' && window.history.length > 1 && location.pathname !== '/'

  const handleBack = () => {
    if (canGoBack) {
      navigate(-1)
    } else {
      navigate('/library')
    }
  }

  const handleForward = () => {
    navigate(1)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '行测错题复盘',
          url: window.location.href,
        })
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('链接已复制')
      } catch {}
    }
  }

  const handleHome = () => {
    navigate('/library')
  }

  return (
    <div className="bottom-bar">
      <button className="bottom-bar-btn" onClick={handleBack} aria-label="返回">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>
      <button className="bottom-bar-btn" onClick={handleForward} aria-label="前进">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
      <button className="bottom-bar-btn" onClick={handleShare} aria-label="分享">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </button>
      <button className="bottom-bar-btn" onClick={handleHome} aria-label="首页">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v9l4 4" />
        </svg>
      </button>
    </div>
  )
}
