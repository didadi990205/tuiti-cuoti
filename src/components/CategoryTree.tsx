import { useState } from 'react'
import { useStore } from '@/hooks/useStore'
import type { Category } from '@/types'
import { buildCategoryTree, getCategoryDescendants } from '@/utils/category'

interface Props {
  categories: Category[]
  selected: string[]
  onToggle: (id: string) => void
}

// 侧边栏内分类树：一级可折叠，右侧显示数量；点击筛选
export default function CategoryTree({ categories, selected, onToggle }: Props) {
  const data = useStore()
  const tree = buildCategoryTree(categories)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(tree.map(n => n.category.id)))

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

  return (
    <div className="category-tree">
      {tree.map(node => (
        <div key={node.category.id} className="category-tree-group">
          <div
            className={`category-tree-parent${selected.includes(node.category.id) ? ' active' : ''}`}
            onClick={() => onToggle(node.category.id)}
          >
            <span className="category-tree-dot" style={{ background: node.category.color }} />
            <span className="category-tree-name">{node.category.name}</span>
            <span className="category-tree-count">{getCount(node.category.id)} 题</span>
            <button
              className="category-tree-expand"
              onClick={e => { e.stopPropagation(); toggleExpand(node.category.id) }}
              aria-label={expanded.has(node.category.id) ? '折叠' : '展开'}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ transform: expanded.has(node.category.id) ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s' }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
          {expanded.has(node.category.id) && (
            <div className="category-tree-children">
              {node.children.map(child => (
                <div
                  key={child.category.id}
                  className={`category-tree-child${selected.includes(child.category.id) ? ' active' : ''}`}
                  onClick={() => onToggle(child.category.id)}
                >
                  <span className="category-tree-dot" style={{ background: child.category.color }} />
                  <span className="category-tree-name">{child.category.name}</span>
                  <span className="category-tree-count">{getCount(child.category.id)} 题</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
