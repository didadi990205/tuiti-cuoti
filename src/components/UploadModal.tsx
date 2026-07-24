import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { store } from '@/store'
import { useStore } from '@/hooks/useStore'
import { compressImage, readFileAsDataUrl } from '@/utils/image'
import CropModal from './CropModal'
import type { Difficulty, ReviewStatus, CorrectOption } from '@/types'
import './UploadModal.css'

interface Props {
  open: boolean
  onClose: () => void
  // 可选：编辑模式（用于"上传"入口外的复用，但实际编辑走EditPage）
  editId?: string
}

// 统一上传弹窗：上传图片 → 手动裁剪 → 选择分类 → 填写复盘备注 + 选项/难度/状态
export default function UploadModal({ open, onClose }: Props) {
  const data = useStore()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [rawImage, setRawImage] = useState<string | null>(null) // 原始上传图
  const [finalImage, setFinalImage] = useState<string | null>(null) // 裁剪后图
  const [finalThumb, setFinalThumb] = useState<string | null>(null)
  const [showCrop, setShowCrop] = useState(false)
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [correctOption, setCorrectOption] = useState<CorrectOption>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('pending')
  const [remark, setRemark] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewCatInput, setShowNewCatInput] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const sortedCategories = [...data.categories].sort((a, b) => a.order - b.order)

  const resetState = () => {
    setRawImage(null)
    setFinalImage(null)
    setFinalThumb(null)
    setShowCrop(false)
    setCategoryIds([])
    setCorrectOption(null)
    setDifficulty('medium')
    setReviewStatus('pending')
    setRemark('')
    setNewCategoryName('')
    setShowNewCatInput(false)
    setError('')
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }
    setError('')
    try {
      // 读取原图用于裁剪展示（不压缩，保留裁剪精度）
      const dataUrl = await readFileAsDataUrl(file)
      setRawImage(dataUrl)
      setFinalImage(null)
      setFinalThumb(null)
      setShowCrop(true)
    } catch (err) {
      console.error(err)
      setError('图片读取失败')
    }
    // 清空input以便重复选择同一文件
    e.target.value = ''
  }

  const handleCropComplete = (img: string, thumb: string) => {
    setFinalImage(img)
    setFinalThumb(thumb)
    setShowCrop(false)
  }

  // 重新裁剪：唤起裁剪弹窗
  const handleRecrop = () => {
    if (!rawImage) return
    setShowCrop(true)
  }

  // 使用原图（跳过裁剪）
  const handleUseOriginal = async () => {
    if (!rawImage) return
    try {
      setProcessing(true)
      // 压缩原图
      const img = new Image()
      img.src = rawImage
      await new Promise(r => { img.onload = r })
      // 用compressImage处理（需要File/Blob，这里直接转canvas）
      const canvas = document.createElement('canvas')
      const maxSize = 1600
      const ratio = Math.min(1, maxSize / Math.max(img.width, img.height))
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      // 缩略图
      const thumbCanvas = document.createElement('canvas')
      const thumbMax = 280
      const tr = Math.min(1, thumbMax / Math.max(img.width, img.height))
      thumbCanvas.width = Math.round(img.width * tr)
      thumbCanvas.height = Math.round(img.height * tr)
      const tctx = thumbCanvas.getContext('2d')!
      tctx.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height)
      const thumb = thumbCanvas.toDataURL('image/jpeg', 0.7)
      setFinalImage(dataUrl)
      setFinalThumb(thumb)
      setShowCrop(false)
    } catch (err) {
      console.error(err)
      setError('处理失败')
    } finally {
      setProcessing(false)
    }
  }

  const toggleCategory = (id: string) => {
    setCategoryIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handleAddCategory = () => {
    const name = newCategoryName.trim()
    if (!name) return
    try {
      const cat = store.addCategory(name)
      setCategoryIds(prev => [...prev, cat.id])
      setNewCategoryName('')
      setShowNewCatInput(false)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleSave = () => {
    if (!finalImage) {
      setError('请上传并裁剪图片')
      return
    }
    setProcessing(true)
    try {
      const q = store.addQuestion({
        image: finalImage,
        imageThumb: finalThumb ?? undefined,
        categoryIds,
        correctOption,
        difficulty,
        reviewStatus,
        remark: remark.trim(),
      })
      setProcessing(false)
      resetState()
      onClose()
      // 跳转到编辑页方便后续修改（或停留在上传页继续）
      navigate(`/edit/${q.id}`)
    } catch (err) {
      console.error(err)
      setError('保存失败，可能存储空间不足')
      setProcessing(false)
    }
  }

  return (
    <div className="upload-modal-overlay" onClick={handleClose}>
      <div className="upload-modal" onClick={e => e.stopPropagation()}>
        <div className="upload-modal-header">
          <h3>上传新题</h3>
          <button className="upload-close-btn" onClick={handleClose} aria-label="关闭">×</button>
        </div>

        <div className="upload-modal-body">
          {error && <div className="upload-error">{error}</div>}

          {/* 步骤1：上传图片 */}
          <section className="upload-section">
            <div className="upload-section-title">① 上传图片</div>
            {!finalImage ? (
              <div
                className="upload-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div className="upload-dropzone-text">点击上传题目截图</div>
                <div className="upload-dropzone-hint">支持 JPG / PNG，上传后可手动裁剪</div>
              </div>
            ) : (
              <div className="upload-preview">
                <img src={finalImage} alt="预览" className="upload-preview-img" />
                <div className="upload-preview-actions">
                  <button className="btn btn-ghost btn-sm" onClick={handleRecrop}>重新裁剪</button>
                  <button className="btn btn-text btn-sm" onClick={() => fileInputRef.current?.click()}>更换图片</button>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </section>

          {/* 步骤2：选择分类（含新建分类） */}
          <section className="upload-section">
            <div className="upload-section-title">② 选择分类</div>
            {sortedCategories.length === 0 && !showNewCatInput && (
              <div className="upload-empty-cat">还没有分类，点击下方按钮创建</div>
            )}
            <div className="upload-category-list">
              {sortedCategories.map(cat => (
                <label
                  key={cat.id}
                  className={`upload-category-chip${categoryIds.includes(cat.id) ? ' checked' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={categoryIds.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>

            {showNewCatInput ? (
              <div className="upload-new-cat">
                <input
                  type="text"
                  className="input"
                  placeholder="输入分类名称"
                  value={newCategoryName}
                  autoFocus
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddCategory() }}
                />
                <button className="btn btn-primary btn-sm" onClick={handleAddCategory}>添加</button>
                <button className="btn btn-text btn-sm" onClick={() => { setShowNewCatInput(false); setNewCategoryName('') }}>取消</button>
              </div>
            ) : (
              <button className="upload-add-cat-btn" onClick={() => setShowNewCatInput(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                新建分类
              </button>
            )}
          </section>

          {/* 步骤3：正确选项 */}
          <section className="upload-section">
            <div className="upload-section-title">③ 正确选项（可选）</div>
            <div className="upload-option-row">
              {(['A', 'B', 'C', 'D'] as const).map(opt => (
                <button
                  key={opt}
                  className={`upload-option-btn${correctOption === opt ? ' active' : ''}`}
                  onClick={() => setCorrectOption(correctOption === opt ? null : opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </section>

          {/* 步骤4：难度 */}
          <section className="upload-section">
            <div className="upload-section-title">④ 难度</div>
            <div className="upload-tag-row">
              <button className={`tag-btn${difficulty === 'easy' ? ' active' : ''}`} onClick={() => setDifficulty('easy')}>简单</button>
              <button className={`tag-btn${difficulty === 'medium' ? ' active' : ''}`} onClick={() => setDifficulty('medium')}>中等</button>
              <button className={`tag-btn${difficulty === 'hard' ? ' active' : ''}`} onClick={() => setDifficulty('hard')}>困难</button>
            </div>
          </section>

          {/* 步骤5：复盘状态 */}
          <section className="upload-section">
            <div className="upload-section-title">⑤ 复盘状态</div>
            <div className="upload-tag-row">
              <button className={`tag-btn${reviewStatus === 'pending' ? ' active' : ''}`} onClick={() => setReviewStatus('pending')}>未复盘</button>
              <button className={`tag-btn${reviewStatus === 'reviewed' ? ' active' : ''}`} onClick={() => setReviewStatus('reviewed')}>已复盘</button>
              <button className={`tag-btn${reviewStatus === 'mastered' ? ' active' : ''}`} onClick={() => setReviewStatus('mastered')}>已掌握</button>
            </div>
          </section>

          {/* 步骤6：复盘备注 */}
          <section className="upload-section">
            <div className="upload-section-title">⑥ 复盘备注</div>
            <textarea
              className="textarea upload-remark"
              placeholder="记录解题思路、易错点、图形规律等..."
              rows={5}
              value={remark}
              onChange={e => setRemark(e.target.value)}
            />
          </section>
        </div>

        <div className="upload-modal-footer">
          <button className="btn btn-ghost" onClick={handleClose} disabled={processing}>取消</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={processing || !finalImage}
          >
            {processing ? '保存中...' : '保存错题'}
          </button>
        </div>
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
