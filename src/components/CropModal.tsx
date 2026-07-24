import { useState, useRef, useEffect, useCallback } from 'react'
import { cropImage } from '@/utils/image'

interface Props {
  imageSrc: string
  onCancel: () => void
  onCropComplete: (dataUrl: string, thumb: string) => void
}

interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

// 裁剪弹窗：用户拖拽选择裁剪区域，含重新裁剪/取消按钮
export default function CropModal({ imageSrc, onCancel, onCropComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgRect, setImgRect] = useState({ w: 0, h: 0, left: 0, top: 0 })
  const [crop, setCrop] = useState<CropRect | null>(null)
  const [dragging, setDragging] = useState(false)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [processing, setProcessing] = useState(false)

  // 计算图片在容器中的实际显示位置和尺寸
  useEffect(() => {
    const updateRect = () => {
      const img = imgRef.current
      if (!img) return
      const rect = img.getBoundingClientRect()
      const containerRect = containerRef.current?.getBoundingClientRect()
      setImgRect({
        w: rect.width,
        h: rect.height,
        left: rect.left - (containerRect?.left ?? 0),
        top: rect.top - (containerRect?.top ?? 0),
      })
    }
    // 图片加载后计算
    const img = imgRef.current
    if (img && img.complete) updateRect()
    img?.addEventListener('load', updateRect)
    window.addEventListener('resize', updateRect)
    return () => {
      img?.removeEventListener('load', updateRect)
      window.removeEventListener('resize', updateRect)
    }
  }, [])

  // 触摸/鼠标事件转坐标
  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return { x: 0, y: 0 }
    let clientX: number, clientY: number
    if ('touches' in e) {
      const t = e.touches[0] || e.changedTouches[0]
      clientX = t.clientX
      clientY = t.clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    return {
      x: clientX - containerRect.left - imgRect.left,
      y: clientY - containerRect.top - imgRect.top,
    }
  }, [imgRect])

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (processing) return
    e.preventDefault()
    const pos = getPos(e)
    if (pos.x < 0 || pos.x > imgRect.w || pos.y < 0 || pos.y > imgRect.h) return
    setDragging(true)
    setStartPoint(pos)
    setCrop({ x: pos.x, y: pos.y, w: 0, h: 0 })
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging || !startPoint) return
    e.preventDefault()
    const pos = getPos(e)
    // 限制在图片范围内
    const clampedX = Math.max(0, Math.min(imgRect.w, pos.x))
    const clampedY = Math.max(0, Math.min(imgRect.h, pos.y))
    setCrop({
      x: Math.min(startPoint.x, clampedX),
      y: Math.min(startPoint.y, clampedY),
      w: Math.abs(clampedX - startPoint.x),
      h: Math.abs(clampedY - startPoint.y),
    })
  }

  const handleEnd = () => {
    setDragging(false)
    setStartPoint(null)
  }

  const handleConfirm = async () => {
    if (!crop || crop.w < 10 || crop.h < 10) {
      alert('请拖拽选择有效的裁剪区域')
      return
    }
    if (!imgRef.current) return
    setProcessing(true)
    try {
      const img = imgRef.current
      const { dataUrl, thumb } = await cropImage(
        imageSrc,
        crop.x,
        crop.y,
        crop.w,
        crop.h,
        imgRect.w,
        imgRect.h
      )
      // 校验图片有效（避免裁剪失败）
      if (!dataUrl || dataUrl.length < 100) {
        throw new Error('裁剪失败')
      }
      onCropComplete(dataUrl, thumb)
    } catch (err) {
      console.error(err)
      alert('裁剪失败，请重试')
    } finally {
      setProcessing(false)
    }
  }

  const handleRecrop = () => {
    setCrop(null)
  }

  return (
    <div className="crop-modal-overlay" onClick={onCancel}>
      <div className="crop-modal" onClick={e => e.stopPropagation()}>
        <div className="crop-modal-header">
          <h3>裁剪图片</h3>
          <button className="crop-close-btn" onClick={onCancel} aria-label="取消">×</button>
        </div>
        <div className="crop-modal-body">
          <p className="crop-tip">拖拽选择要保留的区域，已预留安全边距防止丢失内容</p>
          <div
            className="crop-canvas"
            ref={containerRef}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="待裁剪"
              className="crop-img"
              draggable={false}
            />
            {/* 半透明遮罩 */}
            {crop && crop.w > 0 && crop.h > 0 && (
              <>
                <div className="crop-mask" style={{
                  left: 0, top: 0, width: imgRect.left + crop.x, height: imgRect.top + imgRect.h,
                }} />
                <div className="crop-mask" style={{
                  left: imgRect.left + crop.x + crop.w, top: 0,
                  width: imgRect.w - crop.x - crop.w + (imgRect.w - imgRect.w), height: imgRect.top + imgRect.h,
                }} />
                <div className="crop-mask" style={{
                  left: imgRect.left + crop.x, top: 0, width: crop.w, height: imgRect.top + crop.y,
                }} />
                <div className="crop-mask" style={{
                  left: imgRect.left + crop.x, top: imgRect.top + crop.y + crop.h,
                  width: crop.w, height: imgRect.h - crop.y - crop.h,
                }} />
                <div
                  className="crop-rect"
                  style={{
                    left: imgRect.left + crop.x,
                    top: imgRect.top + crop.y,
                    width: crop.w,
                    height: crop.h,
                  }}
                >
                  <div className="crop-handle crop-handle-tl" />
                  <div className="crop-handle crop-handle-tr" />
                  <div className="crop-handle crop-handle-bl" />
                  <div className="crop-handle crop-handle-br" />
                </div>
              </>
            )}
          </div>
        </div>
        <div className="crop-modal-footer">
          <button className="btn btn-ghost" onClick={onCancel} disabled={processing}>
            取消
          </button>
          {crop && crop.w > 10 && crop.h > 10 && (
            <button className="btn btn-ghost" onClick={handleRecrop} disabled={processing}>
              重新裁剪
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={processing || !crop || crop.w < 10 || crop.h < 10}
          >
            {processing ? '处理中...' : '确认裁剪'}
          </button>
        </div>
      </div>
    </div>
  )
}
