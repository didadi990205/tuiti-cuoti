import { useMemo } from 'react'
import { useStore } from '@/hooks/useStore'
import { store } from '@/store'
import type { ReviewStatus } from '@/types'

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: '未复盘',
  once: '1次复盘',
  many: '多次复盘',
  mastered: '已掌握',
}

const STATUS_COLOR: Record<ReviewStatus, string> = {
  pending: '#8c8c8c',
  once: '#1677ff',
  many: '#722ed1',
  mastered: '#52c41a',
}

export default function StatsPage() {
  const data = useStore()
  const stats = useMemo(() => store.getCategoryStats(), [data])

  const totals = useMemo(() => {
    const q = data.questions
    return {
      total: q.length,
      pending: q.filter(x => x.reviewStatus === 'pending').length,
      once: q.filter(x => x.reviewStatus === 'once').length,
      many: q.filter(x => x.reviewStatus === 'many').length,
      mastered: q.filter(x => x.reviewStatus === 'mastered').length,
      oneStar: q.filter(x => x.difficulty === 1).length,
      twoStar: q.filter(x => x.difficulty === 2).length,
      threeStar: q.filter(x => x.difficulty === 3).length,
      fourStar: q.filter(x => x.difficulty === 4).length,
      fiveStar: q.filter(x => x.difficulty === 5).length,
    }
  }, [data])

  const reviewedRate = totals.total > 0 ? Math.round(((totals.once + totals.many + totals.mastered) / totals.total) * 100) : 0
  const masteredRate = totals.total > 0 ? Math.round((totals.mastered / totals.total) * 100) : 0

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
          <div className="stats-empty-hint">上传错题后自动生成可视化分析</div>
        </div>
      ) : (
        <div className="stats-body">
          <section className="stats-overview">
            <div className="overview-card overview-total">
              <div className="overview-num">{totals.total}</div>
              <div className="overview-label">累计错题</div>
            </div>
            <div className="overview-card">
              <div className="overview-num" style={{ color: STATUS_COLOR.pending }}>{totals.pending}</div>
              <div className="overview-label">未复盘</div>
            </div>
            <div className="overview-card">
              <div className="overview-num" style={{ color: STATUS_COLOR.once }}>{totals.once + totals.many}</div>
              <div className="overview-label">已复盘</div>
            </div>
            <div className="overview-card">
              <div className="overview-num" style={{ color: STATUS_COLOR.mastered }}>{totals.mastered}</div>
              <div className="overview-label">已掌握</div>
            </div>
          </section>

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
            </div>
            <div className="progress-card">
              <h3>掌握进度</h3>
              <div className="progress-ring-wrap">
                <ProgressRing percent={masteredRate} color={STATUS_COLOR.mastered} />
                <div className="progress-ring-text">
                  <div className="progress-ring-num">{masteredRate}%</div>
                  <div className="progress-ring-label">已掌握</div>
                </div>
              </div>
            </div>
          </section>

          <section className="stats-section">
            <h3 className="stats-section-title">复盘情况</h3>
            <div className="stats-diff-bars">
              {(['pending', 'once', 'many', 'mastered'] as ReviewStatus[]).map(s => (
                <DiffBar key={s} label={STATUS_LABEL[s]} count={totals[s]} total={totals.total} color={STATUS_COLOR[s]} />
              ))}
            </div>
          </section>

          <section className="stats-section">
            <h3 className="stats-section-title">难度分布</h3>
            <div className="stats-diff-bars">
              <DiffBar label="1星" count={totals.oneStar} total={totals.total} color="#faad14" />
              <DiffBar label="2星" count={totals.twoStar} total={totals.total} color="#faad14" />
              <DiffBar label="3星" count={totals.threeStar} total={totals.total} color="#faad14" />
              <DiffBar label="4星" count={totals.fourStar} total={totals.total} color="#faad14" />
              <DiffBar label="5星" count={totals.fiveStar} total={totals.total} color="#faad14" />
            </div>
          </section>

          <section className="stats-section">
            <h3 className="stats-section-title">分类错题数量</h3>
            {stats.length === 0 ? (
              <div className="stats-no-cat">暂无分类</div>
            ) : (
              <div className="stats-cat-list">
                {stats.map(s => (
                  <div key={s.category.id} className="stats-cat-item">
                    <div className="stats-cat-info">
                      <span className="stats-cat-name" style={{ color: s.category.color }}>{s.category.name}</span>
                      <span className="stats-cat-total">{s.total} 题</span>
                    </div>
                    <div className="stats-cat-bar">
                      <div className="stats-cat-bar-fill" style={{ width: `${(s.total / maxTotal) * 100}%`, background: s.category.color }} />
                    </div>
                    <div className="stats-cat-detail">
                      <span style={{ color: STATUS_COLOR.pending }}>未 {s.pending}</span>
                      <span style={{ color: STATUS_COLOR.once }}>1次 {s.once}</span>
                      <span style={{ color: STATUS_COLOR.many }}>多次 {s.many}</span>
                      <span style={{ color: STATUS_COLOR.mastered }}>掌握 {s.mastered}</span>
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
      <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 55 55)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
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
