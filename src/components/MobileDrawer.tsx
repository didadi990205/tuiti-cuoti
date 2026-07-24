import { NavLink } from 'react-router-dom'
import { Icon } from './Sidebar'

interface Props {
  open: boolean
  onClose: () => void
}

// 菜单按使用频率排序
const menus = [
  { path: '/library', label: '错题题库', icon: Icon.library },
  { path: '/upload', label: '上传题目', icon: Icon.upload },
  { path: '/stats', label: '统计看板', icon: Icon.stats },
  { path: '/notes', label: '知识点', icon: Icon.notes },
  { path: '/settings', label: '设置', icon: Icon.settings },
]

export default function MobileDrawer({ open, onClose }: Props) {
  if (!open) return null
  return (
    <div className="mobile-drawer-overlay" onClick={onClose}>
      <aside className="mobile-drawer" onClick={e => e.stopPropagation()}>
        <div className="mobile-drawer-header">
          <div className="mobile-drawer-brand">
            {Icon.logo}
            <span>图推错题工作台</span>
          </div>
          <button className="mobile-drawer-close" onClick={onClose} aria-label="关闭">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        </div>
        <nav className="mobile-drawer-nav">
          {menus.map(m => (
            <NavLink
              key={m.path}
              to={m.path}
              className={({ isActive }) => `mobile-drawer-link${isActive ? ' active' : ''}`}
            >
              <span className="mobile-drawer-icon">{m.icon}</span>
              <span>{m.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  )
}
