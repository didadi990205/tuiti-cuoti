import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { store } from '@/store'
import { useStore } from '@/hooks/useStore'
import { readFileAsDataUrl } from '@/utils/image'
import CropModal from '@/components/CropModal'
import CategoryTree from '@/components/CategoryTree'
import StarRating from '@/components/StarRating'
import type { ReviewStatus } from '@/types'

export default function EditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const data = useStore()
  const question = data.questions.find(q => q.id === id)

  const [remark, setRemark] = useState('')
  const [image, setImage] = useState('')
  const [imageThumb, setImageThumb] = useState<string | undefined>(undefined)
  const [dirty, setDirty] = useState(false)
  const [showCrop, setShowCrop] = useState(false)
  const [rawImage, setRawImage] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [savedTip, setSavedTip] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (question) {
      setRemark(question.remark)
      setImage(question.image)
      setImageThumb(question.imageThumb)
      setDirty(false)
    }
  }, [question?.id])

  if (!question) {
    return (
      <div className="edit-empty">
        <div>错题不存在或已删除</div>
        <button className="btn btn-primary" onClick={() => navigate('/library')}>返回题库</button>
      </div>
    )
  }

  const updateTag = (patch: Partial<typeof question>) => {
    store.updateQuestion(question.id, patch)
  }

  const toggleCategory = (catId: string) => {
    const next = question.categoryIds.includes(catId)
      ? question.categoryIds.filter(c => c !== catId)
      : [...question.categoryIds, catId]
    updateTag({ categoryIds: next })
  }

  const handleRemarkChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRemark(e.target.value)
    setDirty(true)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setRawImage(dataUrl)
      setShowCrop(true)
    } catch (err) {
      alert('图片读取失败')
    }
    e.target.value = ''
  }

  const handleCropComplete = (img: string, thumb: string) => {
    setImage(img)
    setImageThumb(thumb)
    setShowCrop(false)
    setDirty(true)
  }

  const dismissKeyboard = () => {
    textareaRef.current?.blur()
  }

  const handleSave = () => {
    if (!dirty) return
    setProcessing(true)
    try {
      store.updateQuestion(question.id, {
        remark: remark.trim(),
        image,
        imageThumb,
      })
      setDirty(false)
      setSavedTip(true)
      setTimeout(() => setSavedTip(false), 1500)
    } catch (err) {
      alert('保存失败')
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = () => {
    if (confirm('确认删除该错题？')) {
      store.deleteQuestion(question.id)
      navigate('/library')
    }
  }

  const reviewOptions: { value: ReviewStatus; label: string; count: number }[] = [
    { value: 'pending', label: '未复盘', count: 0 },
    { value: 'once', label: '1次复盘', count: 1 },
    { value: 'many', label: '多次复盘', count: 2 },
    { value: 'mastered', label: '已掌握', count: 2 },
  ]

  return (
    <div className="edit-page">
      {savedTip && (
        <div className="save-tip">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#52c41a" strokeWidth="2" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          已保存
        </div>
      )}

      <div className="edit-body">
        {/* 顶部：只有图片标题 + 删除图标在右上角 */}
        <div className="edit-top-bar">
          <h2 className="edit-page-title">编辑错题</h2>
          <button className="edit-delete-icon" onClick={handleDelete} aria-label="删除错题">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>

        <section className="edit-section edit-image-section">
          <div className="edit-image-wrap" onClick={() => fileInputRef.current?.click()}>
            <img src={image} alt="错题" className="edit-image" />
            <div className="edit-image-overlay">
              <span>点击更换图片</span>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          <div className="edit-image-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()}>更换图片</button>
            <button className="btn btn-text btn-sm" onClick={() => { setRawImage(image); setShowCrop(true) }}>重新裁剪</button>
          </div>
        </section>

        <section className="edit-section">
          <div className="edit-section-title">正确答案</div>
          <div className="edit-option-row">
            {(['A', 'B', 'C', 'D'] as const).map(opt => (
              <button
                key={opt}
                className={`edit-option-btn${question.correctOption === opt ? ' active' : ''}`}
                onClick={() => updateTag({ correctOption: question.correctOption === opt ? null : opt })}
              >
                {opt}
              </button>
            ))}
          </div>
        </section>

        <section className="edit-section">
          <div className="edit-section-title">难度</div>
          <StarRating value={question.difficulty} onChange={d => updateTag({ difficulty: d as any })} size={28} />
        </section>

        <section className="edit-section">
          <div className="edit-section-title">复盘情况</div>
          <div className="edit-tag-row">
            {reviewOptions.map(opt => (
              <button
                key={opt.value}
                className={`tag-btn${question.reviewStatus === opt.value ? ' active' : ''}`}
                onClick={() => updateTag({ reviewStatus: opt.value, reviewCount: opt.count })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="edit-section">
          <div className="edit-section-title">分类</div>
          {data.categories.length === 0 ? (
            <div className="edit-empty-cat">暂无分类</div>
          ) : (
            <div className="edit-category-tree">
              <CategoryTree categories={data.categories} selected={question.categoryIds} onToggle={toggleCategory} />
            </div>
          )}
        </section>

        <section className="edit-section">
          <div className="edit-section-title">复盘备注</div>
          <div className="edit-remark-wrap">
            <textarea
              ref={textareaRef}
              className="textarea edit-remark"
              placeholder="记录错因、解法、避坑点等所有复盘内容..."
              rows={6}
              value={remark}
              onChange={handleRemarkChange}
            />
            <button type="button" className="edit-keyboard-dismiss" onClick={dismissKeyboard} aria-label="收起键盘">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </section>
      </div>

      {/* 底部固定：返回 | 保存修改 */}
      <div className="edit-save-bar">
        <button className="btn btn-ghost edit-save-back" onClick={() => navigate('/library')}>返回</button>
        <button className="btn btn-primary edit-save-save" onClick={handleSave} disabled={!dirty || processing}>
          {processing ? '保存中...' : dirty ? '保存修改' : '已保存'}
        </button>
      </div>

      {showCrop && rawImage && (
        <CropModal imageSrc={rawImage} onCancel={() => setShowCrop(false)} onCropComplete={handleCropComplete} />
      )}
    </div>
  )
}
