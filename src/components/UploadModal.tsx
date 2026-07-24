import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { store } from '@/store'
import { useStore } from '@/hooks/useStore'
import { compressImage, readFileAsDataUrl } from '@/utils/image'
import CropModal from './CropModal'
import CategoryTree from './CategoryTree'
import type { Difficulty, ReviewStatus, CorrectOption } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
}

export default function UploadModal({ open, onClose }: Props) {
  const data = useStore()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [rawImage, setRawImage] = useState<string | null>(null)
  const [finalImage, setFinalImage] = useState<string | null>(null)
  const [finalThumb, setFinalThumb] = useState<string | null>(null)
  const [showCrop, setShowCrop] = useState(false)
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [correctOption, setCorrectOption] = useState<CorrectOption>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('pending')
  const [reviewCount, setReviewCount] = useState(0)
  const [remark, setRemark] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const resetState = () => {
    setRawImage(null)
    setFinalImage(null)
    setFinalThumb(null)
    setShowCrop(false)
    setCategoryIds([])
    setCorrectOption(null)
    setDifficulty('medium')
    setReviewStatus('pending')
    setReviewCount(0)
    setRemark('')
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
      const dataUrl = await readFileAsDataUrl(file)
      setRawImage(dataUrl)
      setFinalImage(null)
      setFinalThumb(null)
      setShowCrop(true)
    } catch (err) {
      console.error(err)
      setError('图片读取失败')
    }
    e.target.value = ''
  }

  const handleCropComplete = (img: string, thumb: string) => {
    setFinalImage(img)
    setFinalThumb(thumb)
    setShowCrop(false)
  }

  const handleRecrop = () => {
    if (!rawImage) return
    setShowCrop(true)
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
        reviewCount,
        remark: remark.trim(),
      })
      setProcessing(false)
      resetState()
      onClose()
      navigate(`/edit/${q.id}`)
    } catch (err) {
      console.error(err)
      setError('保存失败')
      setProcessing(false)
    }
  }

  const reviewOptions: { value: ReviewStatus; label: string; count: number }[] = [
    { value: 'pending', label: '未复盘', count: 0 },
    { value: 'once', label: '1次复盘', count: 1 },
    { value: 'many', label: '多次复盘', count: 2 },
    { value: 'mastered', label: '已完全掌握', count: 2 },
  ]

  return (
    <div className="upload-modal-overlay" onClick={handleClose}>
      <div className="upload-modal" onClick={e => e.stopPropagation()}>
        <div className="upload-modal-header">
          <h3>上传新题</h3>
          <button className="upload-close-btn" onClick={handleClose} aria-label="关闭">×</button>
        </div>

        <div className="upload-modal-body">
          {error && <div className="upload-error">{error}</div>}

          <section className="upload-section">
            <div className="upload-section-title">上传图片</div>
            {!finalImage ? (
              <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div className="upload-dropzone-text">点击上传题目截图</div>
                <div className="upload-dropzone-hint">支持 JPG / PNG</div>
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
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          </section>

          <section className="upload-section">
            <div className="upload-section-title">选择分类</div>
            {data.categories.length === 0 ? (
              <div className="upload-empty-cat">暂无分类，请先在设置中创建分类</div>
            ) : (
              <CategoryTree
                categories={data.categories}
                selected={categoryIds}
                onToggle={(id) => {
                  setCategoryIds(prev =>
                    prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
                  )
                }}
              />
            )}
            <button className="upload-add-cat-btn" onClick={() => navigate('/settings')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              去设置新建分类
            </button>
          </section>

          <section className="upload-section">
            <div className="upload-section-title">正确答案</div>
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

          <section className="upload-section">
            <div className="upload-section-title">难度</div>
            <div className="upload-tag-row">
              <button className={`tag-btn${difficulty === 'easy' ? ' active' : ''}`} onClick={() => setDifficulty('easy')}>简单</button>
              <button className={`tag-btn${difficulty === 'medium' ? ' active' : ''}`} onClick={() => setDifficulty('medium')}>中等</button>
              <button className={`tag-btn${difficulty === 'hard' ? ' active' : ''}`} onClick={() => setDifficulty('hard')}>困难</button>
            </div>
          </section>

          <section className="upload-section">
            <div className="upload-section-title">复盘情况</div>
            <div className="upload-tag-row">
              {reviewOptions.map(opt => (
                <button
                  key={opt.value}
                  className={`tag-btn${reviewStatus === opt.value ? ' active' : ''}`}
                  onClick={() => {
                    setReviewStatus(opt.value)
                    setReviewCount(opt.count)
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <section className="upload-section">
            <div className="upload-section-title">复盘备注</div>
            <textarea
              className="textarea upload-remark"
              placeholder="记录错因、解法、避坑点等所有复盘内容..."
              rows={5}
              value={remark}
              onChange={e => setRemark(e.target.value)}
            />
          </section>
        </div>

        <div className="upload-modal-footer">
          <button className="btn btn-ghost" onClick={handleClose} disabled={processing}>取消</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={processing || !finalImage}>
            {processing ? '保存中...' : '保存错题'}
          </button>
        </div>
      </div>

      {showCrop && rawImage && (
        <CropModal imageSrc={rawImage} onCancel={() => setShowCrop(false)} onCropComplete={handleCropComplete} />
      )}
    </div>
  )
}
