import { useState } from 'react'
import { store } from '@/store'
import { useStore } from '@/hooks/useStore'
import type { Category } from '@/types'

// 分类管理：新增、命名、删除、拖拽排序
export default function CategoryManager() {
  const data = useStore()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const sorted = [...data.categories].sort((a, b) => a.order - b.order)

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    try {
      store.addCategory(name)
      setNewName('')
      setError('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleDelete = (cat: Category) => {
    const count = data.questions.filter(q => q.categoryIds.includes(cat.id)).length
    const msg = count > 0
      ? `分类「${cat.name}」下有 ${count} 道错题，删除后错题将保留但移除该分类标签。确认删除？`
      : `确认删除分类「${cat.name}」？`
    if (confirm(msg)) {
      store.deleteCategory(cat.id)
    }
  }

  const handleRename = (cat: Category) => {
    setEditingId(cat.id)
    setEditingName(cat.name)
  }

  const handleRenameSave = () => {
    if (!editingId) return
    const name = editingName.trim()
    if (!name) {
      setEditingId(null)
      return
    }
    try {
      store.renameCategory(editingId, name)
      setEditingId(null)
      setError('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  // 拖拽排序
  const handleDragStart = (id: string) => setDragId(id)
  const handleDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault()
    if (!dragId || dragId === overId) return
    const ids = sorted.map(c => c.id)
    const from = ids.indexOf(dragId)
    const to = ids.indexOf(overId)
    if (from < 0 || to < 0) return
    ids.splice(from, 1)
    ids.splice(to, 0, dragId)
    store.reorderCategories(ids)
  }
  const handleDragEnd = () => setDragId(null)

  // 移动端：上移/下移按钮
  const move = (id: string, dir: -1 | 1) => {
    const ids = sorted.map(c => c.id)
    const idx = ids.indexOf(id)
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
          placeholder="输入新分类名称"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
        />
        <button className="btn btn-primary" onClick={handleAdd}>新增分类</button>
      </div>

      {error && <div className="category-error">{error}</div>}

      {sorted.length === 0 ? (
        <div className="category-empty">
          暂无分类，请新增。所有分类均由你自定义管理。
        </div>
      ) : (
        <div className="category-list">
          {sorted.map((cat, idx) => (
            <div
              key={cat.id}
              className={`category-item${dragId === cat.id ? ' dragging' : ''}`}
              draggable
              onDragStart={() => handleDragStart(cat.id)}
              onDragOver={e => handleDragOver(e, cat.id)}
              onDragEnd={handleDragEnd}
            >
              <div className="category-drag" title="拖拽排序">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </div>

              {editingId === cat.id ? (
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
                <span
                  className="category-name"
                  onDoubleClick={() => handleRename(cat)}
                >
                  {cat.name}
                </span>
              )}

              <span className="category-count">
                {data.questions.filter(q => q.categoryIds.includes(cat.id)).length} 题
              </span>

              <div className="category-actions">
                <button className="btn btn-text btn-sm" onClick={() => move(cat.id, -1)} disabled={idx === 0} title="上移">↑</button>
                <button className="btn btn-text btn-sm" onClick={() => move(cat.id, 1)} disabled={idx === sorted.length - 1} title="下移">↓</button>
                <button className="btn btn-text btn-sm" onClick={() => handleRename(cat)}>改名</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cat)}>删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="category-tip">提示：PC端可拖拽左侧图标排序，移动端使用↑↓按钮。双击分类名可重命名。</div>
    </div>
  )
}
