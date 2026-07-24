import { useState, useRef, useEffect, useCallback } from 'react'
import { cropImage } from '@/utils/image'

interface Props {
  imageSrc: string
  onCancel: () => void
  onCropComplete: (dataUrl: string, thumb: string) => void
}

// 四向边框裁剪：控制 top/bottom/left/right 四条边距
export default function CropModal({ imageSrc, onCancel, onCropComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgRect, setImgRect] = useState({ w: 0, h: 0, left: 0, top: 0 })

  // 边距：百分比（0-1），表示保留的中间区域
  const [top, setTop] = useState(0.05)
  const [bottom, setBottom] = useState(0.05)
  const [left, setLeft] = useState(0.05)
  const [right, setRight] = useState(0.05)

  const [processing, setProcessing] = useState(false)
  const [dragging, setDragging] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null)

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
    const img = imgRef.current
    if (img?.complete) updateRect()
    img?.addEventListener('load', updateRect)
    window.addEventListener('resize', updateRect)
    return () => {
      img?.removeEventListener('load', updateRect)
      window.removeEventListener('resize', updateRect)
    }
  }, [])

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

  const handleStart = (e: React.MouseEvent | React.TouchEvent, edge: 'top' | 'bottom' | 'left' | 'right') => {
    e.preventDefault()
    setDragging(edge)
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging || !imgRect.w || !imgRect.h) return
    e.preventDefault()
    const pos = getPos(e)
    if (dragging === 'top') {
      const pct = Math.max(0, Math.min(1 - bottom - 0.1, pos.y / imgRect.h))
      setTop(pct)
    } else if (dragging === 'bottom') {
      const pct = Math.max(0, Math.min(1 - top - 0.1, 1 - pos.y / imgRect.h))
      setBottom(pct)
    } else if (dragging === 'left') {
      const pct = Math.max(0, Math.min(1 - right - 0.1, pos.x / imgRect.w))
      setLeft(pct)
    } else if (dragging === 'right') {
      const pct = Math.max(0, Math.min(1 - left - 0.1, 1 - pos.x / imgRect.w))
      setRight(pct)
    }
  }

  const handleEnd = () => setDragging(null)

  // 计算裁剪区域（考虑安全边距）
  const handleConfirm = async () => {
    if (!imgRef.current) return
    const img = imgRef.current
    setProcessing(true)
    try {
      // 显示边距 -> 实际裁剪坐标
      const displayX = imgRect.left + left * imgRect.w
      const displayY = imgRect.top + top * imgRect.h
      const displayW = imgRect.w - (left + right) * imgRect.w
      const displayH = imgRect.h - (top + bottom) * imgRect.h

      const { dataUrl, thumb } = await cropImage(
        imageSrc,
        displayX,
        displayY,
        displayW,
        displayH,
        imgRect.w,
        imgRect.h,
        0.02 // 微小安全边距
      )
      if (!dataUrl || dataUrl.length < 100) throw new Error('裁剪失败')
      onCropComplete(dataUrl, thumb)
    } catch (err) {
      console.error(err)
      alert('裁剪失败，请重试')
    } finally {
      setProcessing(false)
    }
  }

  // 重新裁剪：重置为默认边距
  const handleRecrop = () => {
    setTop(0.05)
    setBottom(0.05)
    setLeft(0.05)
    setRight(0.05)
  }

  const cropX = imgRect.left + left * imgRect.w
  const cropY = imgRect.top + top * imgRect.h
  const cropW = imgRect.w - (left + right) * imgRect.w
  const cropH = imgRect.h - (top + bottom) * imgRect.h

  return (
    <div className="crop-modal-overlay" onClick={onCancel}>
      <div className="crop-modal" onClick={e => e.stopPropagation()}>
        <div className="crop-modal-header">
          <h3>重新裁切</h3>
          <button className="crop-close-btn" onClick={onCancel} aria-label="取消">×</button>
        </div>
        <div className="crop-modal-body">
          <p className="crop-tip">拖动图片四周边线，调整保留区域</p>
          <div
            className="crop-canvas"
            ref={containerRef}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
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
            {/* 遮罩 */}
            <div className="crop-mask" style={{
              left: 0, top: 0, width: imgRect.left + imgRect.w, height: imgRect.top + cropY,
            }} />
            <div className="crop-mask" style={{
              left: imgRect.left + cropX + cropW, top: 0,
              width: imgRect.w - cropX - cropW + (imgRect.w - imgRect.w), height: imgRect.top + imgRect.h,
            }} />
            <div className="crop-mask" style={{
              left: imgRect.left + cropX, top: 0, width: cropW, height: imgRect.top + cropY,
            }} />
            <div className="crop-mask" style={{
              left: imgRect.left + cropX, top: imgRect.top + cropY + cropH,
              width: cropW, height: imgRect.h - cropY - cropH,
            }} />

            {/* 保留区域边框 */}
            <div
              className="crop-frame"
              style={{
                left: cropX,
                top: cropY,
                width: cropW,
                height: cropH,
              }}
            />

            {/* 四条可拖动边线 */}
            <div
              className="crop-edge crop-edge-top"
              style={{ left: cropX, top: cropY - 2, width: cropW }}
              onMouseDown={e => handleStart(e, 'top')}
              onTouchStart={e => handleStart(e, 'top')}
            />
            <div
              className="crop-edge crop-edge-bottom"
              style={{ left: cropX, top: cropY + cropH - 2, width: cropW }}
              onMouseDown={e => handleStart(e, 'bottom')}
              onTouchStart={e => handleStart(e, 'bottom')}
            />
            <div
              className="crop-edge crop-edge-left"
              style={{ left: cropX - 2, top: cropY, height: cropH }}
              onMouseDown={e => handleStart(e, 'left')}
              onTouchStart={e => handleStart(e, 'left')}
            />
            <div
              className="crop-edge crop-edge-right"
              style={{ left: cropX + cropW - 2, top: cropY, height: cropH }}
              onMouseDown={e => handleStart(e, 'right')}
              onTouchStart={e => handleStart(e, 'right')}
            />
          </div>
        </div>
        <div className="crop-modal-footer">
          <button className="btn btn-ghost" onClick={onCancel} disabled={processing}>取消</button>
          <button className="btn btn-ghost" onClick={handleRecrop} disabled={processing}>重新裁剪</button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={processing}>
            {processing ? '处理中...' : '确认裁剪'}
          </button>
        </div>
      </div>
    </div>
  )
}
