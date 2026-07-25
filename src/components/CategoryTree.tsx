import { useState } from 'react'
import { store } from '@/store'
import { useStore } from '@/hooks/useStore'
import type { Category } from '@/types'
import { buildCategoryTree, getCategoryDescendants } from '@/utils/category'

interface Props {
  categories: Category[]
  selected: string[]
  onToggle: (id: string) => void
  allowAdd?: boolean
  mode?: 'toggle' | 'select'
  onSelect?: (id: string) => void
}

// 分类树：一级默认展开、可折叠；一级+二级均支持多选（带复选框）
export default function CategoryTree({
  categories,
  selected,
  onToggle,
  allowAdd = false,
  mode = 'toggle',
  onSelect,
}: Props) {
  const data = useStore()
  const tree = buildCategoryTree(categories)
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(tree.map(n => n.category.id))
  )
  const [addingRoot, setAddingRoot] = useState(false)
  const [rootName, setRootName] = useState('')
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null)
  const [subName, setSubName] = useState('')
  const [error, setError] = useState('')

  const getCount = (catId: string) => {
    const allIds = getCategoryDescendants(categories, catId)
    return data.questions.filter(q => q.categoryIds.some(id => allIds.includes(id))).length
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleClick = (id: string) => {
    if (mode === 'select') onSelect?.(id)
    else onToggle(id)
  }

  const handleAddRoot = () => {
    const name = rootName.trim()
    if (!name) return
    try { store.addCategory(name); setRootName(''); setAddingRoot(false); setError('') }
    catch (err) { setError((err as Error).message) }
  }

  const handleAddSub = (parentId: string) => {
    const name = subName.trim()
    if (!name) return
    try {
      store.addCategory(name, parentId)
      setSubName('')
      setAddingSubFor(null)
      setError('')
      setExpanded(prev => new Set(prev).add(parentId))
    } catch (err) { setError((err as Error).message) }
  }

  const checkbox = (id: string, checked: boolean) => (
    <input
      type="checkbox"
      className="ct-checkbox"
      checked={checked}
      onChange={e => { e.stopPropagation(); handleClick(id) }}
      onClick={e => e.stopPropagation()}
    />
  )

  return (
    <div className="category-tree">
      {tree.length === 0 && !addingRoot && (
        <div className="ct-empty">暂无分类{allowAdd ? '，点击下方按钮新增' : ''}</div>
      )}

      {tree.map(node => (
        <div key={node.category.id} className="ct-group">
          <div
            className={`ct-parent${selected.includes(node.category.id) ? ' active' : ''}`}
            onClick={() => handleClick(node.category.id)}
          >
            {checkbox(node.category.id, selected.includes(node.category.id))}
            <button
              className="ct-expand"
              onClick={e => { e.stopPropagation(); toggleExpand(node.category.id) }}
              aria-label={expanded.has(node.category.id) ? '折叠' : '展开'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded.has(node.category.id) ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <span className="ct-dot" style={{ background: node.category.color }} />
            <span className="ct-name">{node.category.name}</span>
            <span className="ct-count">{getCount(node.category.id)}</span>
            {allowAdd && (
              <button className="ct-add-sub" onClick={e => { e.stopPropagation(); setAddingSubFor(node.category.id); setSubName('') }}>
                +子分类
              </button>
            )}
          </div>

          {allowAdd && addingSubFor === node.category.id && (
            <div className="ct-add-input">
              <input
                type="text"
                className="input"
                placeholder={`在「${node.category.name}」下新增子分类`}
                value={subName}
                autoFocus
                onChange={e => setSubName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddSub(node.category.id)
                  if (e.key === 'Escape') { setAddingSubFor(null); setSubName('') }
                }}
              />
              <button className="btn btn-primary btn-sm" onClick={() => handleAddSub(node.category.id)}>添加</button>
              <button className="btn btn-text btn-sm" onClick={() => { setAddingSubFor(null); setSubName('') }}>取消</button>
            </div>
          )}

          {expanded.has(node.category.id) && node.children.length > 0 && (
            <div className="ct-children">
              {node.children.map(child => (
                <div
                  key={child.category.id}
                  className={`ct-child${selected.includes(child.category.id) ? ' active' : ''}`}
                  onClick={() => handleClick(child.category.id)}
                >
                  {checkbox(child.category.id, selected.includes(child.category.id))}
                  <span className="ct-dot small" style={{ background: child.category.color }} />
                  <span className="ct-name">{child.category.name}</span>
                  <span className="ct-count">{getCount(child.category.id)}</span>
                </div>
              ))}
            </div>
          )}

          {expanded.has(node.category.id) && allowAdd && node.children.length === 0 && !addingSubFor && (
            <div className="ct-no-child">暂无子分类</div>
          )}
        </div>
      ))}

      {allowAdd && (
        <>
          {addingRoot ? (
            <div className="ct-add-input">
              <input
                type="text"
                className="input"
                placeholder="输入一级分类名称"
                value={rootName}
                autoFocus
                onChange={e => setRootName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddRoot()
                  if (e.key === 'Escape') { setAddingRoot(false); setRootName('') }
                }}
              />
              <button className="btn btn-primary btn-sm" onClick={handleAddRoot}>添加</button>
              <button className="btn btn-text btn-sm" onClick={() => { setAddingRoot(false); setRootName('') }}>取消</button>
            </div>
          ) : (
            <button className="ct-add-root" onClick={() => setAddingRoot(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              新增一级分类
            </button>
          )}
        </>
      )}

      {error && <div className="ct-error">{error}</div>}
    </div>
  )
}
