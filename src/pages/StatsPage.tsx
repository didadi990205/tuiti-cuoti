import { useMemo } from 'react'
import { useStore } from '@/hooks/useStore'
import { store } from '@/store'
import { useIsMobile } from '@/hooks/useMediaQuery'
import './StatsPage.css'

export default function StatsPage() {
  const data = useStore()
  const isMobile = useIsMobile()

  const stats = useMemo(() => store.getCategoryStats(), [data])

  const totals = useMemo(() => {
    const q = data.questions
    return {
      total: q.length,
      pending: q.filter(x => x.reviewStatus === 'pending').length,
      reviewed: q.filter(x => x.reviewStatus === 'reviewed').length,
      mastered: q.filter(x => x.reviewStatus === 'mastered').length,
      easy: q.filter(x => x.difficulty === 'easy').length,
      medium: q.filter(x => x.difficulty === 'medium').length,
      hard: q.filter(x => x.difficulty === 'hard').length,
    }
  }, [data])

  const masteredRate = totals.total > 0 ? Math.round((totals.mastered / totals.total) * 100) : 0
  const reviewedRate = totals.total > 0 ? Math.round(((totals.reviewed + totals.mastered) / totals.total) * 100) : 0

  // 薄弱项：按"未掌握比例"排序的分类（已掌握占比低 + 题量大 = 薄弱）
  const weakPoints = useMemo(() => {
    return stats
      .filter(s => s.total > 0)
      .map(s => ({
        ...s,
        masteredRate: s.total > 0 ? s.mastered / s.total : 0,
        hardRate: s.total > 0 ? s.hard / s.total : 0,
      }))
      .sort((a, b) => {
        // 薄弱度 = 难题占比高 + 掌握率低
        const wa = a.hardRate * 2 + (1 - a.masteredRate)
        const wb = b.hardRate * 2 + (1 - b.masteredRate)
        return wb - wa
      })
      .slice(0, 5)
  }, [stats])

  const maxTotal = Math.max(1, ...stats.map(s => s.total))

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h1 className="stats-title">统计看板</h1>
      </div>

      {totals.total === 0 ? (
        <div className="stats-empty">
          <div className="stats-empty-icon">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <div className="stats-empty-title">暂无数据</div>
          <div className="stats-empty-hint">上传错题后这里会自动生成可视化分析</div>
        </div>
      ) : (
        <div className="stats-body">
          {/* 总览卡片 */}
          <section className="stats-overview">
            <div className="overview-card overview-total">
              <div className="overview-num">{totals.total}</div>
              <div className="overview-label">累计错题</div>
            </div>
            <div className="overview-card">
              <div className="overview-num" style={{ color: 'var(--text-3)' }}>{totals.pending}</div>
              <div className="overview-label">未复盘</div>
            </div>
            <div className="overview-card">
              <div className="overview-num" style={{ color: 'var(--warning)' }}>{totals.reviewed}</div>
              <div className="overview-label">已复盘</div>
            </div>
            <div className="overview-card">
              <div className="overview-num" style={{ color: 'var(--success)' }}>{totals.mastered}</div>
              <div className="overview-label">已掌握</div>
            </div>
          </section>

          {/* 进度环 */}
          <section className="stats-progress-section">
            <div className="progress-card">
              <h3>复盘进度</h3>
              <div className="progress-ring-wrap">
                <ProgressRing percent={reviewedRate} color="var(--primary)" />
                <div className="progress-ring-text">
                  <div className="progress-ring-num">{reviewedRate}%</div>
                  <div className="progress-ring-label">已复盘</div>
                </div>
              </div>
              <div className="progress-detail">
                <span>{totals.reviewed + totals.mastered} / {totals.total}</span>
              </div>
            </div>
            <div className="progress-card">
              <h3>掌握进度</h3>
              <div className="progress-ring-wrap">
                <ProgressRing percent={masteredRate} color="var(--success)" />
                <div className="progress-ring-text">
                  <div className="progress-ring-num">{masteredRate}%</div>
                  <div className="progress-ring-label">已掌握</div>
                </div>
              </div>
              <div className="progress-detail">
                <span>{totals.mastered} / {totals.total}</span>
              </div>
            </div>
          </section>

          {/* 难度分布 */}
          <section className="stats-section">
            <h3 className="stats-section-title">难度分布</h3>
            <div className="stats-diff-bars">
              <DiffBar label="简单" count={totals.easy} total={totals.total} color="var(--success)" />
              <DiffBar label="中等" count={totals.medium} total={totals.total} color="var(--warning)" />
              <DiffBar label="困难" count={totals.hard} total={totals.total} color="var(--danger)" />
            </div>
          </section>

          {/* 分类分布 */}
          <section className="stats-section">
            <h3 className="stats-section-title">分类错题数量</h3>
            {stats.length === 0 ? (
              <div className="stats-no-cat">暂无分类，请先创建自定义分类</div>
            ) : (
              <div className="stats-cat-list">
                {stats.map(s => (
                  <div key={s.category.id} className="stats-cat-item">
                    <div className="stats-cat-info">
                      <span className="stats-cat-name">{s.category.name}</span>
                      <span className="stats-cat-total">{s.total} 题</span>
                    </div>
                    <div className="stats-cat-bar">
                      <div
                        className="stats-cat-bar-fill"
                        style={{ width: `${(s.total / maxTotal) * 100}%` }}
                      />
                    </div>
                    <div className="stats-cat-detail">
                      <span style={{ color: 'var(--text-3)' }}>未复盘 {s.pending}</span>
                      <span style={{ color: 'var(--warning)' }}>已复盘 {s.reviewed}</span>
                      <span style={{ color: 'var(--success)' }}>已掌握 {s.mastered}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 薄弱项可视化 */}
          <section className="stats-section">
            <h3 className="stats-section-title">薄弱项分析（建议优先复习）</h3>
            {weakPoints.length === 0 ? (
              <div className="stats-no-cat">暂无数据</div>
            ) : (
              <div className="weak-list">
                {weakPoints.map((w, idx) => (
                  <div key={w.category.id} className="weak-item">
                    <div className="weak-rank">#{idx + 1}</div>
                    <div className="weak-info">
                      <div className="weak-name">{w.category.name}</div>
                      <div className="weak-meta">
                        共 {w.total} 题 · 困难 {w.hard} 题 · 掌握率 {Math.round(w.masteredRate * 100)}%
                      </div>
                    </div>
                    <div className="weak-score" title="薄弱度评分">
                      {Math.round((w.hardRate * 2 + (1 - w.masteredRate)) * 50)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function ProgressRing({ percent, color }: { percent: number; color: string }) {
  const r = 42
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
      <circle
        cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 55 55)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

function DiffBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="diff-bar-item">
      <div className="diff-bar-label">{label}</div>
      <div className="diff-bar-track">
        <div className="diff-bar-fill" style={{ width: `${percent}%`, background: color }} />
      </div>
      <div className="diff-bar-count">{count} <span className="diff-bar-pct">({percent}%)</span></div>
    </div>
  )
}
