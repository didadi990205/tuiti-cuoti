import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/hooks/useStore'
import UploadModal from '@/components/UploadModal'
import FilterDrawer from '@/components/FilterDrawer'
import { useIsMobile } from '@/hooks/useMediaQuery'
import './LibraryPage.css'

const STATUS_LABEL = { pending: '未复盘', reviewed: '已复盘', mastered: '已掌握' }
const STATUS_COLOR = { pending: 'var(--text-3)', reviewed: 'var(--warning)', mastered: 'var(--success)' }
const DIFFICULTY_LABEL = { easy: '简单', medium: '中等', hard: '困难' }
const DIFFICULTY_COLOR = { easy: 'var(--success)', medium: 'var(--warning)', hard: 'var(--danger)' }

export default function LibraryPage() {
  const data = useStore()
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [keyword, setKeyword] = useState(searchParams.get('q') || '')
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [showFilter, setShowFilter] = useState(false)

  // 同步URL搜索参数
  useEffect(() => {
    setKeyword(searchParams.get('q') || '')
  }, [searchParams])

  // 知识点页点击分类跳转过来时，自动应用筛选（一次性）
  useEffect(() => {
    const pending = sessionStorage.getItem('pending-filter')
    if (pending) {
      sessionStorage.removeItem('pending-filter')
      setSelectedCats([pending])
    }
  }, [])

  const sortedCategories = useMemo(
    () => [...data.categories].sort((a, b) => a.order - b.order),
    [data.categories]
  )

  // 筛选+搜索
  const filteredQuestions = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    return data.questions.filter(question => {
      if (selectedCats.length > 0) {
        if (!selectedCats.some(id => question.categoryIds.includes(id))) return false
      }
      if (q) {
        const text = (question.remark || '').toLowerCase()
        const catNames = question.categoryIds
          .map(id => data.categories.find(c => c.id === id)?.name || '')
          .join(' ')
          .toLowerCase()
        if (!text.includes(q) && !catNames.includes(q)) return false
      }
      return true
    })
  }, [data.questions, data.categories, keyword, selectedCats])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams(keyword ? { q: keyword } : {})
  }

  const handleClearFilter = () => setSelectedCats([])

  return (
    <div className="library-page">
      <div className="library-header">
        <div className="library-title-row">
          <h1 className="library-title">错题题库</h1>
          <span className="library-count">共 {filteredQuestions.length} 题</span>
        </div>

        {!isMobile && (
          <form className="library-search" onSubmit={handleSearch}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="搜索备注或分类名..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
            {keyword && (
              <button type="button" className="library-search-clear" onClick={() => { setKeyword(''); setSearchParams({}) }}>×</button>
            )}
          </form>
        )}

        <div className="library-actions">
          <button
            className="btn btn-ghost"
            onClick={() => setShowFilter(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            筛选{selectedCats.length > 0 && <span className="filter-badge">{selectedCats.length}</span>}
          </button>
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            上传新题
          </button>
        </div>
      </div>

      {/* 已选筛选标签 */}
      {selectedCats.length > 0 && (
        <div className="library-active-filters">
          <span className="library-active-label">已筛选：</span>
          {selectedCats.map(id => {
            const cat = sortedCategories.find(c => c.id === id)
            if (!cat) return null
            return (
              <span key={id} className="library-active-tag">
                {cat.name}
                <button onClick={() => setSelectedCats(selectedCats.filter(c => c !== id))}>×</button>
              </span>
            )
          })}
          <button className="btn btn-text btn-sm" onClick={handleClearFilter}>清除全部</button>
        </div>
      )}

      {/* 错题列表 */}
      {filteredQuestions.length === 0 ? (
        <div className="library-empty">
          <div className="library-empty-icon">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M3 10h18M9 4v16" />
            </svg>
          </div>
          <div className="library-empty-title">暂无错题</div>
          <div className="library-empty-hint">上传题目开始整理图推错题</div>
          <button className="btn btn-primary btn-lg" onClick={() => setShowUpload(true)}>上传第一道题</button>
        </div>
      ) : (
        <div className="library-grid">
          {filteredQuestions.map(q => {
            const cats = q.categoryIds
              .map(id => data.categories.find(c => c.id === id))
              .filter(Boolean)
            return (
              <div
                key={q.id}
                className="question-card"
                onClick={() => navigate(`/edit/${q.id}`)}
              >
                <div className="question-card-img">
                  <img src={q.imageThumb || q.image} alt="错题" loading="lazy" />
                  <div className="question-card-badges">
                    {q.correctOption && (
                      <span className="q-badge q-badge-option">答案 {q.correctOption}</span>
                    )}
                    <span className="q-badge" style={{ background: 'rgba(255,255,255,0.9)', color: DIFFICULTY_COLOR[q.difficulty] }}>
                      {DIFFICULTY_LABEL[q.difficulty]}
                    </span>
                    <span className="q-badge" style={{ background: 'rgba(255,255,255,0.9)', color: STATUS_COLOR[q.reviewStatus] }}>
                      {STATUS_LABEL[q.reviewStatus]}
                    </span>
                  </div>
                </div>
                {cats.length > 0 && (
                  <div className="question-card-cats">
                    {cats.map(c => (
                      <span key={c!.id} className="q-cat">{c!.name}</span>
                    ))}
                  </div>
                )}
                {q.remark && (
                  <div className="question-card-remark">{q.remark}</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} />
      <FilterDrawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        selected={selectedCats}
        onChange={setSelectedCats}
      />
    </div>
  )
}
