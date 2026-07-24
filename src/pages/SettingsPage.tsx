import { useState, useRef } from 'react'
import { store } from '@/store'
import { useStore } from '@/hooks/useStore'
import CategoryManager from '@/components/CategoryManager'
import './SettingsPage.css'

export default function SettingsPage() {
  const data = useStore()
  const [importMsg, setImportMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const json = store.exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const date = new Date().toISOString().slice(0, 10)
    a.download = `tuiti-cuoti-backup-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const ok = store.importData(reader.result as string)
      setImportMsg(ok ? '导入成功' : '导入失败：文件格式错误')
      setTimeout(() => setImportMsg(''), 3000)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleClear = () => {
    if (confirm('⚠️ 确认清空所有数据？\n\n所有错题、笔记、分类将被永久删除，且无法恢复。\n建议先导出备份。\n\n确认请点击"确定"。')) {
      if (confirm('再次确认：真的要清空全部数据吗？此操作不可撤销。')) {
        store.clearAll()
        setImportMsg('已清空全部数据')
        setTimeout(() => setImportMsg(''), 3000)
      }
    }
  }

  const totalImages = data.questions.reduce((sum, q) => sum + (q.image.length + (q.imageThumb?.length ?? 0)), 0)
    + data.notes.reduce((sum, n) => sum + n.images.reduce((s, img) => s + img.length, 0), 0)
  const storageKB = Math.round((totalImages / 1024) * 0.75) // base64→实际约0.75

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">设置</h1>
      </div>

      <div className="settings-body">
        {/* 分类管理 */}
        <section className="settings-section">
          <h2 className="settings-section-title">分类管理</h2>
          <p className="settings-section-desc">全量自定义分类，可新增、命名、删除、拖拽排序。所有错题与笔记均可关联多个分类。</p>
          <CategoryManager />
        </section>

        {/* 数据管理 */}
        <section className="settings-section">
          <h2 className="settings-section-title">数据管理</h2>
          <div className="settings-data-stats">
            <div className="data-stat-item">
              <span className="data-stat-label">错题数</span>
              <span className="data-stat-value">{data.questions.length}</span>
            </div>
            <div className="data-stat-item">
              <span className="data-stat-label">笔记数</span>
              <span className="data-stat-value">{data.notes.length}</span>
            </div>
            <div className="data-stat-item">
              <span className="data-stat-label">分类数</span>
              <span className="data-stat-value">{data.categories.length}</span>
            </div>
            <div className="data-stat-item">
              <span className="data-stat-label">存储占用（约）</span>
              <span className="data-stat-value">{storageKB > 1024 ? `${(storageKB / 1024).toFixed(1)}MB` : `${storageKB}KB`}</span>
            </div>
          </div>

          <div className="settings-data-actions">
            <button className="btn btn-ghost" onClick={handleExport}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              导出备份
            </button>
            <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              导入备份
            </button>
            <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </div>

          {importMsg && <div className="settings-msg">{importMsg}</div>}

          <div className="settings-danger-zone">
            <h3>危险操作</h3>
            <button className="btn btn-danger" onClick={handleClear}>清空全部数据</button>
          </div>
        </section>

        {/* 关于 */}
        <section className="settings-section">
          <h2 className="settings-section-title">关于</h2>
          <div className="settings-about">
            <p><strong>图推错题工作台</strong> · v1.0.0</p>
            <p>专为行测图形推理错题整理设计，支持自定义分类、手动裁剪、复盘管理、知识点笔记、薄弱项分析。</p>
            <p>所有数据存储在浏览器本地（localStorage），不会上传到任何服务器。</p>
            <p className="settings-tip">💡 建议<span style={{whiteSpace:'nowrap'}}>定期「导出备份」</span>以防数据丢失，更换设备/浏览器前请先导出。</p>
          </div>
        </section>
      </div>
    </div>
  )
}
