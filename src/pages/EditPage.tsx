import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { store } from '@/store'
import { useStore } from '@/hooks/useStore'
import { compressImage, readFileAsDataUrl, cropImage } from '@/utils/image'
import CropModal from '@/components/CropModal'
import type { Difficulty, ReviewStatus, CorrectOption } from '@/types'
import './EditPage.css'

export default function EditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const data = useStore()
  const question = data.questions.find(q => q.id === id)

  const [remark, setRemark] = useState('')
  const [image, setImage] = useState('')
  const [imageThumb, setImageThumb] = useState<string | undefined>(undefined)
  const [dirty, setDirty] = useState(false) // 内容改动是否未保存
  const [showCrop, setShowCrop] = useState(false)
  const [rawImage, setRawImage] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 初始化表单值
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
        <div className="edit-empty-text">错题不存在或已删除</div>
        <button className="btn btn-primary" onClick={() => navigate('/library')}>返回题库</button>
      </div>
    )
  }

  // ===== 标签类操作：即时写入 =====
  const updateTag = (patch: Partial<typeof question>) => {
    store.updateQuestion(question.id, patch)
  }

  const toggleCategory = (catId: string) => {
    const next = question.categoryIds.includes(catId)
      ? question.categoryIds.filter(c => c !== catId)
      : [...question.categoryIds, catId]
    updateTag({ categoryIds: next })
  }

  // ===== 内容类操作：标记未保存 =====
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

  const handleLongPress = () => {
    // 长按图片唤起裁剪弹窗（重新裁剪当前图）
    setRawImage(image)
    setShowCrop(true)
  }

  // 收起键盘按钮
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
    } catch (err) {
      alert('保存失败')
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = () => {
    if (confirm('确认删除该错题？图片和备注将一并清除，不可恢复。')) {
      store.deleteQuestion(question.id)
      navigate('/library')
    }
  }

  const sortedCategories = [...data.categories].sort((a, b) => a.order - b.order)

  const difficultyOptions: { value: Difficulty; label: string }[] = [
    { value: 'easy', label: '简单' },
    { value: 'medium', label: '中等' },
    { value: 'hard', label: '困难' },
  ]
  const statusOptions: { value: ReviewStatus; label: string }[] = [
    { value: 'pending', label: '未复盘' },
    { value: 'reviewed', label: '已复盘' },
    { value: 'mastered', label: '已掌握' },
  ]

  return (
    <div className="edit-page">
      <div className="edit-header">
        <button className="btn btn-text" onClick={() => navigate('/library')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          返回
        </button>
        <h2>编辑错题</h2>
        <button className="btn btn-danger btn-sm" onClick={handleDelete}>删除</button>
      </div>

      <div className="edit-body">
        {/* 图片区：长按唤起裁剪 */}
        <section className="edit-section edit-image-section">
          <div
            className="edit-image-wrap"
            onClick={() => fileInputRef.current?.click()}
            onContextMenu={(e) => { e.preventDefault(); handleLongPress() }}
          >
            <img src={image} alt="错题" className="edit-image" />
            <div className="edit-image-overlay">
              <span>点击更换 · 长按裁剪</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div className="edit-image-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()}>更换图片</button>
            <button className="btn btn-text btn-sm" onClick={handleLongPress}>重新裁剪</button>
          </div>
        </section>

        {/* 正确选项（即时写入） */}
        <section className="edit-section">
          <div className="edit-section-title">正确选项</div>
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

        {/* 难度（即时写入） */}
        <section className="edit-section">
          <div className="edit-section-title">难度</div>
          <div className="edit-tag-row">
            {difficultyOptions.map(opt => (
              <button
                key={opt.value}
                className={`tag-btn${question.difficulty === opt.value ? ' active' : ''}`}
                onClick={() => updateTag({ difficulty: opt.value })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* 复盘状态（即时写入） */}
        <section className="edit-section">
          <div className="edit-section-title">复盘状态</div>
          <div className="edit-tag-row">
            {statusOptions.map(opt => (
              <button
                key={opt.value}
                className={`tag-btn${question.reviewStatus === opt.value ? ' active' : ''}`}
                onClick={() => updateTag({ reviewStatus: opt.value })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* 分类（即时写入） */}
        <section className="edit-section">
          <div className="edit-section-title">分类</div>
          {sortedCategories.length === 0 ? (
            <div className="edit-empty-cat">暂无分类，<a href="#/settings">前往设置创建</a></div>
          ) : (
            <div className="edit-category-chips">
              {sortedCategories.map(cat => (
                <label
                  key={cat.id}
                  className={`upload-category-chip${question.categoryIds.includes(cat.id) ? ' checked' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={question.categoryIds.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          )}
        </section>

        {/* 复盘备注（标记未保存） */}
        <section className="edit-section">
          <div className="edit-section-title">复盘备注</div>
          <div className="edit-remark-wrap">
            <textarea
              ref={textareaRef}
              className="textarea edit-remark"
              placeholder="记录解题思路、易错点、图形规律等..."
              rows={6}
              value={remark}
              onChange={handleRemarkChange}
            />
            <button
              type="button"
              className="edit-keyboard-dismiss"
              onClick={dismissKeyboard}
              aria-label="收起键盘"
              title="收起键盘"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </section>
      </div>

      {/* 底部悬浮保存栏：无修改置灰，有修改高亮 */}
      <div className="edit-save-bar">
        <button
          className="btn btn-primary btn-block"
          onClick={handleSave}
          disabled={!dirty || processing}
        >
          {processing ? '保存中...' : dirty ? '保存修改' : '已保存'}
        </button>
      </div>

      {showCrop && rawImage && (
        <CropModal
          imageSrc={rawImage}
          onCancel={() => setShowCrop(false)}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  )
}
