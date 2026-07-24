import { useState } from 'react'
import { useStore } from '@/hooks/useStore'
import { store } from '@/store'
import { buildCategoryTree } from '@/utils/category'
import type { Category } from '@/types'

export default function CategoryManager() {
  const data = useStore()
  const [newCatName, setNewCatName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null)
  const [subName, setSubName] = useState('')
  const [error, setError] = useState('')

  const tree = buildCategoryTree(data.categories)

  const handleAddRoot = () => {
    const name = newCatName.trim()
    if (!name) return
    try {
      store.addCategory(name)
      setNewCatName('')
      setError('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleAddSub = (parentId: string) => {
    const name = subName.trim()
    if (!name) return
    try {
      store.addCategory(name, parentId)
      setSubName('')
      setAddingSubFor(null)
      setError('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleRename = (cat: Category) => {
    setEditingId(cat.id)
    setEditingName(cat.name)
  }

  const handleRenameSave = () => {
    if (!editingId) return
    try {
      store.renameCategory(editingId, editingName)
      setEditingId(null)
      setError('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleDelete = (cat: Category) => {
    const count = data.questions.filter(q => q.categoryIds.includes(cat.id)).length
    const msg = count > 0
      ? `「${cat.name}」下有 ${count} 道错题，删除后该分类关联将移除。确认删除？`
      : `确认删除分类「${cat.name}」？（含子分类将一并删除）`
    if (confirm(msg)) {
      store.deleteCategory(cat.id)
    }
  }

  // 上移/下移
  const move = (cat: Category, dir: -1 | 1) => {
    const siblings = data.categories
      .filter(c => c.parentId === cat.parentId)
      .sort((a, b) => a.order - b.order)
    const ids = siblings.map(c => c.id)
    const idx = ids.indexOf(cat.id)
    const target = idx + dir
    if (target < 0 || target >= ids.length) return
    ;[ids[idx], ids[target]] = [ids[target], ids[idx]]
    store.reorderCategories(ids)
  }

  return (
    <div className="category-manager">
      <div className="category-add-row">
        <input
          type="text"
          className="input"
          placeholder="新增一级分类"
          value={newCatName}
          onChange={e => setNewCatName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAddRoot() }}
        />
        <button className="btn btn-primary" onClick={handleAddRoot}>新增</button>
      </div>

      {error && <div className="category-error">{error}</div>}

      {tree.length === 0 ? (
        <div className="category-empty">暂无分类，请先创建一级分类</div>
      ) : (
        <div className="category-tree-list">
          {tree.map((node, rootIdx) => (
            <div key={node.category.id} className="category-tree-node">
              <div className="category-tree-row">
                <span className="category-tree-dot" style={{ background: node.category.color }} />
                {editingId === node.category.id ? (
                  <input
                    type="text"
                    className="input category-rename-input"
                    value={editingName}
                    autoFocus
                    onChange={e => setEditingName(e.target.value)}
                    onBlur={handleRenameSave}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRenameSave()
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                ) : (
                  <span className="category-tree-name" onDoubleClick={() => handleRename(node.category)}>
                    {node.category.name}
                  </span>
                )}
                <span className="category-tree-count">
                  {data.questions.filter(q => q.categoryIds.includes(node.category.id)).length} 题
                </span>
                <div className="category-tree-actions">
                  <button className="btn btn-text btn-sm" onClick={() => { setAddingSubFor(node.category.id); setSubName('') }}>添加子类</button>
                  <button className="btn btn-text btn-sm" onClick={() => handleRename(node.category)}>改名</button>
                  <button className="btn btn-text btn-sm" onClick={() => move(node.category, -1)} disabled={rootIdx === 0}>↑</button>
                  <button className="btn btn-text btn-sm" onClick={() => move(node.category, 1)} disabled={rootIdx === tree.length - 1}>↓</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(node.category)}>删除</button>
                </div>
              </div>

              {addingSubFor === node.category.id && (
                <div className="category-add-sub">
                  <input
                    type="text"
                    className="input"
                    placeholder="子分类名称"
                    value={subName}
                    autoFocus
                    onChange={e => setSubName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddSub(node.category.id) }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => handleAddSub(node.category.id)}>添加</button>
                  <button className="btn btn-text btn-sm" onClick={() => setAddingSubFor(null)}>取消</button>
                </div>
              )}

              {node.children.length > 0 && (
                <div className="category-tree-children-box">
                  {node.children.map((child, childIdx) => (
                    <div key={child.category.id} className="category-tree-row child">
                      <span className="category-tree-dot small" style={{ background: child.category.color }} />
                      {editingId === child.category.id ? (
                        <input
                          type="text"
                          className="input category-rename-input"
                          value={editingName}
                          autoFocus
                          onChange={e => setEditingName(e.target.value)}
                          onBlur={handleRenameSave}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleRenameSave()
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                        />
                      ) : (
                        <span className="category-tree-name" onDoubleClick={() => handleRename(child.category)}>
                          {child.category.name}
                        </span>
                      )}
                      <span className="category-tree-count">
                        {data.questions.filter(q => q.categoryIds.includes(child.category.id)).length} 题
                      </span>
                      <div className="category-tree-actions">
                        <button className="btn btn-text btn-sm" onClick={() => handleRename(child.category)}>改名</button>
                        <button className="btn btn-text btn-sm" onClick={() => move(child.category, -1)} disabled={childIdx === 0}>↑</button>
                        <button className="btn btn-text btn-sm" onClick={() => move(child.category, 1)} disabled={childIdx === node.children.length - 1}>↓</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(child.category)}>删除</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
