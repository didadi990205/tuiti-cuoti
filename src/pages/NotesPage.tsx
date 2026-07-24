import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { store } from '@/store'
import { useStore } from '@/hooks/useStore'
import { compressImage, readFileAsDataUrl } from '@/utils/image'
import CategoryTree from '@/components/CategoryTree'
import type { Note } from '@/types'
import './NotesPage.css'

export default function NotesPage() {
  const data = useStore()
  const navigate = useNavigate()
  const [editing, setEditing] = useState<Note | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [keyword, setKeyword] = useState('')

  // 新建笔记表单状态
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [noteImages, setNoteImages] = useState<string[]>([])
  const [noteCats, setNoteCats] = useState<string[]>([])
  const [dirty, setDirty] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sortedCategories = useMemo(
    () => [...data.categories].sort((a, b) => a.order - b.order),
    [data.categories]
  )

  const filteredNotes = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    return data.notes.filter(note => {
      if (selectedCats.length > 0 && !selectedCats.some(id => note.categoryIds.includes(id))) return false
      if (q) {
        const text = (note.title + ' ' + note.content).toLowerCase()
        if (!text.includes(q)) return false
      }
      return true
    })
  }, [data.notes, keyword, selectedCats])

  // 打开编辑器（新建或编辑）
  const handleNew = () => {
    setEditing(null)
    setTitle('')
    setContent('')
    setNoteImages([])
    setNoteCats([])
    setDirty(false)
    setShowEditor(true)
  }

  const handleEdit = (note: Note) => {
    setEditing(note)
    setTitle(note.title)
    setContent(note.content)
    setNoteImages(note.images)
    setNoteCats(note.categoryIds)
    setDirty(false)
    setShowEditor(true)
  }

  const handleSave = () => {
    if (!title.trim()) {
      alert('请输入笔记标题')
      return
    }
    if (editing) {
      store.updateNote(editing.id, {
        title: title.trim(),
        content: content.trim(),
        images: noteImages,
        categoryIds: noteCats,
      })
    } else {
      store.addNote({
        title: title.trim(),
        content: content.trim(),
        images: noteImages,
        categoryIds: noteCats,
      })
    }
    setShowEditor(false)
    setEditing(null)
    setDirty(false)
  }

  const handleDelete = (note: Note) => {
    if (confirm(`确认删除笔记「${note.title}」？`)) {
      store.deleteNote(note.id)
    }
  }

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const compressed = await Promise.all(files.map(f => compressImage(f, 1200, 0.85)))
    setNoteImages(prev => [...prev, ...compressed.map(c => c.dataUrl)])
    setDirty(true)
    e.target.value = ''
  }

  const removeImage = (idx: number) => {
    setNoteImages(prev => prev.filter((_, i) => i !== idx))
    setDirty(true)
  }

  const toggleNoteCat = (id: string) => {
    setNoteCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
    setDirty(true)
  }

  // 点击分类：跳转题库并筛选该分类
  const handleJumpToLibrary = (catId: string) => {
    navigate(`/library`)
    sessionStorage.setItem('pending-filter', JSON.stringify([catId]))
  }

  const toggleSelectedCat = (id: string) => {
    setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  return (
    <div className="notes-page">
      <div className="notes-header">
        <h1 className="notes-title">知识点专区</h1>
        <div className="notes-actions">
          <button className="btn btn-primary" onClick={handleNew}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            新建笔记
          </button>
        </div>
      </div>

      {/* 分类快捷跳转：点击进入题库筛选对应分类 */}
      {sortedCategories.length > 0 && (
        <div className="notes-cat-jump">
          <span className="notes-cat-label">按分类查看错题：</span>
          {sortedCategories.map(cat => (
            <button
              key={cat.id}
              className="notes-cat-jump-btn"
              onClick={() => handleJumpToLibrary(cat.id)}
              title={`查看「${cat.name}」分类下的错题`}
            >
              {cat.name}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* 搜索 + 筛选 */}
      <div className="notes-filter-bar">
        <input
          type="text"
          className="input"
          placeholder="搜索笔记..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
        />
        {sortedCategories.length > 0 && (
          <div className="notes-filter-chips">
            <CategoryTree
              categories={data.categories}
              selected={selectedCats}
              onToggle={toggleSelectedCat}
            />
          </div>
        )}
      </div>

      {/* 笔记列表 */}
      {filteredNotes.length === 0 ? (
        <div className="notes-empty">
          <div className="notes-empty-icon">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="14" y2="17" />
            </svg>
          </div>
          <div className="notes-empty-title">暂无笔记</div>
          <div className="notes-empty-hint">整理图推笔记，构建你的知识体系</div>
          <button className="btn btn-primary" onClick={handleNew}>新建第一篇笔记</button>
        </div>
      ) : (
        <div className="notes-list">
          {filteredNotes.map(note => (
            <div key={note.id} className="note-card">
              <div className="note-card-header">
                <h3 className="note-card-title">{note.title}</h3>
                <div className="note-card-actions">
                  <button className="btn btn-text btn-sm" onClick={() => handleEdit(note)}>编辑</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(note)}>删除</button>
                </div>
              </div>
              {note.categoryIds.length > 0 && (
                <div className="note-card-cats">
                  {note.categoryIds.map(id => {
                    const c = data.categories.find(x => x.id === id)
                    return c ? <span key={id} className="note-cat">{c.name}</span> : null
                  })}
                </div>
              )}
              {note.content && <div className="note-card-content">{note.content}</div>}
              {note.images.length > 0 && (
                <div className="note-card-images">
                  {note.images.map((img, idx) => (
                    <img key={idx} src={img} alt={`图${idx + 1}`} className="note-card-img" loading="lazy" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 编辑器弹窗 */}
      {showEditor && (
        <div className="note-editor-overlay" onClick={() => dirty && !confirm('有未保存的修改，确认关闭？') ? null : setShowEditor(false)}>
          <div className="note-editor" onClick={e => e.stopPropagation()}>
            <div className="note-editor-header">
              <h3>{editing ? '编辑笔记' : '新建笔记'}</h3>
              <button className="note-editor-close" onClick={() => setShowEditor(false)}>×</button>
            </div>
            <div className="note-editor-body">
              <input
                type="text"
                className="input"
                placeholder="笔记标题"
                value={title}
                onChange={e => { setTitle(e.target.value); setDirty(true) }}
              />
              <textarea
                className="textarea"
                placeholder="笔记正文（支持纯文本记录图形规律、考点总结...）"
                rows={8}
                value={content}
                onChange={e => { setContent(e.target.value); setDirty(true) }}
              />

              {/* 图片 */}
              <div className="note-editor-images">
                {noteImages.map((img, idx) => (
                  <div key={idx} className="note-editor-img">
                    <img src={img} alt={`图${idx + 1}`} />
                    <button onClick={() => removeImage(idx)} aria-label="删除">×</button>
                  </div>
                ))}
                <button className="note-editor-add-img" onClick={() => fileInputRef.current?.click()}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>添加图片</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAddImage}
                  style={{ display: 'none' }}
                />
              </div>

              {/* 分类 */}
              {data.categories.length > 0 && (
                <div className="note-editor-cats">
                  <div className="note-editor-label">归属分类</div>
                  <CategoryTree categories={data.categories} selected={noteCats} onToggle={toggleNoteCat} />
                </div>
              )}
            </div>
            <div className="note-editor-footer">
              <button className="btn btn-ghost" onClick={() => setShowEditor(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSave}>{editing ? '保存修改' : '创建笔记'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
