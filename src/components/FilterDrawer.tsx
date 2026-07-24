import { useStore } from '@/hooks/useStore'
import type { Category } from '@/types'
import './FilterDrawer.css'

interface Props {
  open: boolean
  onClose: () => void
  selected: string[]
  onChange: (ids: string[]) => void
  // 知识点页复用时可改为筛选notes，这里默认题库
  title?: string
}

// 筛选抽屉：移动端从右侧滑出，承载所有分类标签的多选筛选
export default function FilterDrawer({ open, onClose, selected, onChange, title = '筛选分类' }: Props) {
  const data = useStore()
  const sorted = [...data.categories].sort((a, b) => a.order - b.order)

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(c => c !== id) : [...selected, id])
  }

  const clearAll = () => onChange([])
  const selectAll = () => onChange(sorted.map(c => c.id))

  if (!open) return null

  return (
    <div className="filter-overlay" onClick={onClose}>
      <aside className="filter-drawer" onClick={e => e.stopPropagation()}>
        <div className="filter-header">
          <h3>{title}</h3>
          <button className="filter-close" onClick={onClose} aria-label="关闭">×</button>
        </div>

        <div className="filter-actions">
          <button className="btn btn-text btn-sm" onClick={selectAll}>全选</button>
          <button className="btn btn-text btn-sm" onClick={clearAll} disabled={selected.length === 0}>清空</button>
          <span className="filter-count">已选 {selected.length} 项</span>
        </div>

        <div className="filter-list">
          {sorted.length === 0 ? (
            <div className="filter-empty">暂无分类，请先在设置或上传时创建</div>
          ) : (
            sorted.map((cat: Category) => {
              const count = data.questions.filter(q => q.categoryIds.includes(cat.id)).length
              return (
                <label key={cat.id} className={`filter-item${selected.includes(cat.id) ? ' checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selected.includes(cat.id)}
                    onChange={() => toggle(cat.id)}
                  />
                  <span className="filter-item-name">{cat.name}</span>
                  <span className="filter-item-count">{count}</span>
                </label>
              )
            })
          )}
        </div>

        <div className="filter-footer">
          <button className="btn btn-primary btn-block" onClick={onClose}>
            查看结果（{data.questions.filter(q => selected.length === 0 || selected.some(id => q.categoryIds.includes(id))).length} 题）
          </button>
        </div>
      </aside>
    </div>
  )
}
