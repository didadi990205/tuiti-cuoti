import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/hooks/useStore'
import UploadModal from '@/components/UploadModal'
import CategoryTree from '@/components/CategoryTree'
import { buildCategoryTree, formatRelativeTime } from '@/utils/category'
import { useIsMobile } from '@/hooks/useMediaQuery'
import type { Difficulty, ReviewStatus } from '@/types'

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: '未复盘',
  once: '1次复盘',
  many: '多次复盘',
  mastered: '已掌握',
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: '简单', medium: '中等', hard: '困难' }

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy: '#52c41a',
  medium: '#faad14',
  hard: '#f5222d',
}

export default function LibraryPage() {
  const data = useStore()
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  const [keyword, setKeyword] = useState('')
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all')
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | 'all'>('all')
  const [showUpload, setShowUpload] = useState(false)
  const [showFilter, setShowFilter] = useState(false)

  // 从 sessionStorage 读取抽屉或知识点跳转的筛选
  useEffect(() => {
    const pending = sessionStorage.getItem('pending-filter')
    if (pending) {
      try {
        const parsed = JSON.parse(pending)
        if (Array.isArray(parsed)) setSelectedCats(parsed)
        else setSelectedCats([parsed])
      } catch {
        setSelectedCats([pending])
      }
      sessionStorage.removeItem('pending-filter')
    }
    const search = sessionStorage.getItem('pending-search')
    if (search) {
      setKeyword(search)
      sessionStorage.removeItem('pending-search')
    }
  }, [])

  const filteredQuestions = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    return data.questions.filter(question => {
      if (selectedCats.length > 0) {
        if (!selectedCats.some(id => question.categoryIds.includes(id))) return false
      }
      if (difficulty !== 'all' && question.difficulty !== difficulty) return false
      if (reviewStatus !== 'all' && question.reviewStatus !== reviewStatus) return false
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
  }, [data.questions, data.categories, keyword, selectedCats, difficulty, reviewStatus])

  const tree = buildCategoryTree(data.categories)
  const activeFilterCount = selectedCats.length + (difficulty !== 'all' ? 1 : 0) + (reviewStatus !== 'all' ? 1 : 0)

  const resetFilters = () => {
    setKeyword('')
    setSelectedCats([])
    setDifficulty('all')
    setReviewStatus('all')
  }

  const toggleCat = (id: string) => {
    setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  return (
    <div className="library-page">
      <div className="library-header">
        <div className="library-title-row">
          <h1 className="library-title">错题题库</h1>
          <span className="library-count">
            共 {filteredQuestions.length} 题
            {activeFilterCount > 0 && <span className="filter-count-hint"> · 筛选 {activeFilterCount} 项</span>}
          </span>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="library-search-wrap">
        <div className="library-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="搜索错题备注..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          {keyword && (
            <button className="library-search-clear" onClick={() => setKeyword('')}>×</button>
          )}
        </div>
        <button className="btn btn-ghost filter-btn" onClick={() => setShowFilter(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          筛选
          {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
        </button>
      </div>

      {/* 已激活筛选标签 */}
      {activeFilterCount > 0 && (
        <div className="library-active-filters">
          {selectedCats.map(id => {
            const cat = data.categories.find(c => c.id === id)
            if (!cat) return null
            return (
              <span key={id} className="library-active-tag">
                <span className="tag-dot" style={{ background: cat.color }} />
                {cat.name}
                <button onClick={() => setSelectedCats(prev => prev.filter(c => c !== id))}>×</button>
              </span>
            )
          })}
          {difficulty !== 'all' && (
            <span className="library-active-tag">
              难度：{DIFFICULTY_LABEL[difficulty]}
              <button onClick={() => setDifficulty('all')}>×</button>
            </span>
          )}
          {reviewStatus !== 'all' && (
            <span className="library-active-tag">
              {STATUS_LABEL[reviewStatus]}
              <button onClick={() => setReviewStatus('all')}>×</button>
            </span>
          )}
          <button className="btn btn-text btn-sm" onClick={resetFilters}>清除全部</button>
        </div>
      )}

      {/* 列表 */}
      {filteredQuestions.length === 0 ? (
        <div className="library-empty">
          <div className="library-empty-icon">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M3 10h18M9 4v16" />
            </svg>
          </div>
          <div className="library-empty-title">{activeFilterCount > 0 ? '无筛选结果' : '暂无错题'}</div>
          <div className="library-empty-hint">
            {activeFilterCount > 0 ? '换个筛选条件试试' : '上传题目开始整理错题'}
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => activeFilterCount > 0 ? resetFilters() : setShowUpload(true)}>
            {activeFilterCount > 0 ? '清除筛选' : '上传第一道题'}
          </button>
        </div>
      ) : (
        <div className="library-list">
          {filteredQuestions.map(q => (
            <div key={q.id} className="question-card" onClick={() => navigate(`/edit/${q.id}`)}>
              <div className="question-card-main">
                <div className="question-card-thumb">
                  <img src={q.imageThumb || q.image} alt="错题" loading="lazy" />
                </div>
                <div className="question-card-info">
                  <div className="question-card-meta">
                    {q.correctOption && (
                      <span className="q-answer">答案 {q.correctOption}</span>
                    )}
                    <span className="q-status" style={{
                      color: q.reviewStatus === 'mastered' ? '#52c41a' : q.reviewStatus === 'pending' ? '#8c8c8c' : '#1677ff',
                      background: q.reviewStatus === 'mastered' ? '#f6ffed' : q.reviewStatus === 'pending' ? '#f5f5f5' : '#e6f4ff',
                    }}>
                      {STATUS_LABEL[q.reviewStatus]}
                    </span>
                    <span className="q-difficulty" style={{ color: DIFFICULTY_COLOR[q.difficulty], background: hexToRgba(DIFFICULTY_COLOR[q.difficulty], 0.1) }}>
                      {DIFFICULTY_LABEL[q.difficulty]}
                    </span>
                    <span className="q-time">{formatRelativeTime(q.createdAt)}</span>
                  </div>
                  <div className="question-card-title">
                    {q.remark || '暂无备注'}
                  </div>
                  <div className="question-card-cats">
                    {q.categoryIds.map(id => {
                      const cat = data.categories.find(c => c.id === id)
                      if (!cat) return null
                      return (
                        <span key={id} className="q-cat" style={{ color: cat.color, background: hexToRgba(cat.color, 0.1) }}>
                          <span className="q-cat-dot" style={{ background: cat.color }} />
                          {cat.name}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} />

      {/* 筛选抽屉 */}
      {showFilter && (
        <div className="filter-overlay" onClick={() => setShowFilter(false)}>
          <aside className="filter-drawer" onClick={e => e.stopPropagation()}>
            <div className="filter-header">
              <h3>筛选错题</h3>
              <button className="filter-close" onClick={() => setShowFilter(false)}>×</button>
            </div>
            <div className="filter-body">
              <section className="filter-section">
                <div className="filter-section-title">分类</div>
                {tree.length === 0 ? (
                  <div className="filter-empty">暂无分类</div>
                ) : (
                  <CategoryTree categories={data.categories} selected={selectedCats} onToggle={toggleCat} />
                )}
              </section>
              <section className="filter-section">
                <div className="filter-section-title">难度</div>
                <div className="filter-tag-row">
                  <button className={`filter-tag${difficulty === 'all' ? ' active' : ''}`} onClick={() => setDifficulty('all')}>全部</button>
                  <button className={`filter-tag${difficulty === 'easy' ? ' active' : ''}`} onClick={() => setDifficulty('easy')}>简单</button>
                  <button className={`filter-tag${difficulty === 'medium' ? ' active' : ''}`} onClick={() => setDifficulty('medium')}>中等</button>
                  <button className={`filter-tag${difficulty === 'hard' ? ' active' : ''}`} onClick={() => setDifficulty('hard')}>困难</button>
                </div>
              </section>
              <section className="filter-section">
                <div className="filter-section-title">复盘情况</div>
                <div className="filter-tag-row">
                  <button className={`filter-tag${reviewStatus === 'all' ? ' active' : ''}`} onClick={() => setReviewStatus('all')}>全部</button>
                  <button className={`filter-tag${reviewStatus === 'pending' ? ' active' : ''}`} onClick={() => setReviewStatus('pending')}>未复盘</button>
                  <button className={`filter-tag${reviewStatus === 'once' ? ' active' : ''}`} onClick={() => setReviewStatus('once')}>1次复盘</button>
                  <button className={`filter-tag${reviewStatus === 'many' ? ' active' : ''}`} onClick={() => setReviewStatus('many')}>多次复盘</button>
                  <button className={`filter-tag${reviewStatus === 'mastered' ? ' active' : ''}`} onClick={() => setReviewStatus('mastered')}>已掌握</button>
                </div>
              </section>
            </div>
            <div className="filter-footer">
              <button className="btn btn-ghost" onClick={resetFilters}>重置</button>
              <button className="btn btn-primary" onClick={() => setShowFilter(false)}>
                查看结果（{filteredQuestions.length} 题）
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
