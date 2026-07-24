import { useState, useRef, useEffect, useCallback } from 'react'
import { cropImage } from '@/utils/image'

interface Props {
  imageSrc: string
  onCancel: () => void
  onCropComplete: (dataUrl: string, thumb: string) => void
}

// 八把手 + 框内拖动整体 + RAF 性能优化
export default function CropModal({ imageSrc, onCancel, onCropComplete }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })

  // 裁剪框相对于图片显示区域左上角的坐标和尺寸（单位 px，相对于图片自然显示尺寸）
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 })
  const rafRef = useRef<number | null>(null)
  const pendingCrop = useRef(crop)

  // 拖动状态
  const dragRef = useRef<{
    type: 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
    startX: number
    startY: number
    orig: { x: number; y: number; w: number; h: number }
  } | null>(null)

  // 图片加载后初始化裁剪框（居中 80%）
  useEffect(() => {
    if (!imgLoaded || !imgRef.current) return
    const img = imgRef.current
    const w = img.naturalWidth
    const h = img.naturalHeight
    setImgSize({ w, h })
    setCrop({
      x: w * 0.1,
      y: h * 0.1,
      w: w * 0.8,
      h: h * 0.8,
    })
  }, [imgLoaded])

  // RAF 批量更新，降低拖动渲染延迟
  const flushCrop = useCallback(() => {
    rafRef.current = null
    setCrop(pendingCrop.current)
  }, [])

  const scheduleUpdate = useCallback((next: typeof crop) => {
    pendingCrop.current = next
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(flushCrop)
    }
  }, [flushCrop])

  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
  }, [])

  const getEventPos = (e: React.MouseEvent | React.TouchEvent) => {
    const img = imgRef.current
    if (!img) return { x: 0, y: 0 }
    const rect = img.getBoundingClientRect()
    let clientX: number, clientY: number
    if ('touches' in e) {
      const t = e.touches[0] || e.changedTouches[0]
      clientX = t.clientX
      clientY = t.clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    // 转换为图片自然坐标
    const scaleX = img.naturalWidth / rect.width
    const scaleY = img.naturalHeight / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  const startDrag = (
    e: React.MouseEvent | React.TouchEvent,
    type: 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
  ) => {
    e.preventDefault()
    e.stopPropagation()
    const pos = getEventPos(e)
    dragRef.current = {
      type,
      startX: pos.x,
      startY: pos.y,
      orig: { ...pendingCrop.current },
    }
  }

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    const drag = dragRef.current
    if (!drag) return
    e.preventDefault()
    const pos = getEventPos(e)
    const dx = pos.x - drag.startX
    const dy = pos.y - drag.startY
    const o = drag.orig
    const MIN = 40 // 最小裁剪尺寸

    let { x, y, w, h } = o

    if (drag.type === 'move') {
      // 整体移动，限制在图片范围内
      x = Math.max(0, Math.min(imgSize.w - o.w, o.x + dx))
      y = Math.max(0, Math.min(imgSize.h - o.h, o.y + dy))
    } else {
      // 八把手调整
      if (drag.type.includes('w')) {
        const newX = Math.max(0, Math.min(o.x + o.w - MIN, o.x + dx))
        w = o.w - (newX - o.x)
        x = newX
      }
      if (drag.type.includes('e')) {
        w = Math.max(MIN, Math.min(imgSize.w - o.x, o.w + dx))
      }
      if (drag.type.includes('n')) {
        const newY = Math.max(0, Math.min(o.y + o.h - MIN, o.y + dy))
        h = o.h - (newY - o.y)
        y = newY
      }
      if (drag.type.includes('s')) {
        h = Math.max(MIN, Math.min(imgSize.h - o.y, o.h + dy))
      }
    }

    scheduleUpdate({ x, y, w, h })
  }

  const endDrag = () => {
    dragRef.current = null
  }

  const handleConfirm = async () => {
    if (!imgRef.current || crop.w < 10 || crop.h < 10) return
    const img = imgRef.current
    setProcessing(true)
    try {
      // 直接用图片自然坐标裁剪
      const { dataUrl, thumb } = await cropImage(
        imageSrc,
        crop.x,
        crop.y,
        crop.w,
        crop.h,
        imgSize.w,
        imgSize.h,
        0.02
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

  const handleRecrop = () => {
    setCrop({
      x: imgSize.w * 0.1,
      y: imgSize.h * 0.1,
      w: imgSize.w * 0.8,
      h: imgSize.h * 0.8,
    })
    // 滚动回左上
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0
      scrollRef.current.scrollTop = 0
    }
  }

  const [processing, setProcessing] = useState(false)

  return (
    <div className="crop-modal-overlay" onClick={onCancel}>
      <div className="crop-modal" onClick={e => e.stopPropagation()}>
        <div className="crop-modal-header">
          <h3>裁剪图片</h3>
          <button className="crop-close-btn" onClick={onCancel} aria-label="取消">×</button>
        </div>
        <div className="crop-modal-body">
          <p className="crop-tip">拖动四角/四边调整区域，按住框内可整体移动</p>
          <div className="crop-scroll" ref={scrollRef}>
            <div
              className="crop-img-wrap"
              onMouseMove={onMove}
              onMouseUp={endDrag}
              onMouseLeave={endDrag}
              onTouchMove={onMove}
              onTouchEnd={endDrag}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="待裁剪"
                className="crop-img"
                draggable={false}
                onLoad={() => setImgLoaded(true)}
              />
              {imgLoaded && crop.w > 0 && (
                <>
                  {/* 四周遮罩 */}
                  <div className="crop-mask" style={{ left: 0, top: 0, width: crop.x, height: imgSize.h }} />
                  <div className="crop-mask" style={{ left: crop.x + crop.w, top: 0, width: imgSize.w - crop.x - crop.w, height: imgSize.h }} />
                  <div className="crop-mask" style={{ left: crop.x, top: 0, width: crop.w, height: crop.y }} />
                  <div className="crop-mask" style={{ left: crop.x, top: crop.y + crop.h, width: crop.w, height: imgSize.h - crop.y - crop.h }} />

                  {/* 裁剪框 */}
                  <div
                    className="crop-frame"
                    style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h }}
                    onMouseDown={e => startDrag(e, 'move')}
                    onTouchStart={e => startDrag(e, 'move')}
                  >
                    {/* 网格辅助线 */}
                    <div className="crop-grid-h" style={{ top: '33.33%' }} />
                    <div className="crop-grid-h" style={{ top: '66.66%' }} />
                    <div className="crop-grid-v" style={{ left: '33.33%' }} />
                    <div className="crop-grid-v" style={{ left: '66.66%' }} />

                    {/* 八把手 */}
                    <div className="crop-handle h-nw" onMouseDown={e => startDrag(e, 'nw')} onTouchStart={e => startDrag(e, 'nw')} />
                    <div className="crop-handle h-n" onMouseDown={e => startDrag(e, 'n')} onTouchStart={e => startDrag(e, 'n')} />
                    <div className="crop-handle h-ne" onMouseDown={e => startDrag(e, 'ne')} onTouchStart={e => startDrag(e, 'ne')} />
                    <div className="crop-handle h-e" onMouseDown={e => startDrag(e, 'e')} onTouchStart={e => startDrag(e, 'e')} />
                    <div className="crop-handle h-se" onMouseDown={e => startDrag(e, 'se')} onTouchStart={e => startDrag(e, 'se')} />
                    <div className="crop-handle h-s" onMouseDown={e => startDrag(e, 's')} onTouchStart={e => startDrag(e, 's')} />
                    <div className="crop-handle h-sw" onMouseDown={e => startDrag(e, 'sw')} onTouchStart={e => startDrag(e, 'sw')} />
                    <div className="crop-handle h-w" onMouseDown={e => startDrag(e, 'w')} onTouchStart={e => startDrag(e, 'w')} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="crop-modal-footer">
          <button className="btn btn-ghost" onClick={onCancel} disabled={processing}>取消</button>
          <button className="btn btn-ghost" onClick={handleRecrop} disabled={processing}>重新裁剪</button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={processing || !imgLoaded}>
            {processing ? '处理中...' : '确认裁剪'}
          </button>
        </div>
      </div>
    </div>
  )
}
