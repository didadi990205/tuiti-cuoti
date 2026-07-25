import { useState, useRef, useEffect, useCallback } from 'react'

interface Props {
  imageSrc: string
  onCancel: () => void
  onCropComplete: (dataUrl: string, thumb: string) => void
}

// 八把手 + 框内拖动图片 裁剪
export default function CropModal({ imageSrc, onCancel, onCropComplete }: Props) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })

  // 图片在容器内的偏移（用于框内拖动整体移动）
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 })
  // 裁剪框在容器内的坐标和尺寸（容器大小就是图片大小）
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 })

  const [processing, setProcessing] = useState(false)
  const rafRef = useRef<number | null>(null)
  const pendingCrop = useRef(crop)
  const pendingOffset = useRef(imgOffset)
  const dragRef = useRef<{
    type: 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
    startX: number
    startY: number
    origCrop: { x: number; y: number; w: number; h: number }
    origOffset: { x: number; y: number }
  } | null>(null)

  // 初始化：图片加载完成后设置容器和裁剪框
  useEffect(() => {
    if (!imgLoaded || !imgRef.current) return
    const img = imgRef.current
    const w = img.naturalWidth
    const h = img.naturalHeight
    setImgSize({ w, h })
    // 裁剪框居中 80%
    setCrop({ x: w * 0.1, y: h * 0.1, w: w * 0.8, h: h * 0.8 })
    setImgOffset({ x: 0, y: 0 })
  }, [imgLoaded])

  // RAF 批量更新，降低拖动渲染延迟
  const flush = useCallback(() => {
    rafRef.current = null
    setCrop(pendingCrop.current)
    setImgOffset(pendingOffset.current)
  }, [])

  const schedule = useCallback((nextCrop: typeof crop, nextOffset: typeof imgOffset) => {
    pendingCrop.current = nextCrop
    pendingOffset.current = nextOffset
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(flush)
    }
  }, [flush])

  useEffect(() => () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current) }, [])

  // 获取鼠标/触摸在容器内的坐标（容器即图片大小）
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
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
    // 容器内坐标，不考虑缩放（CSS 缩放不影响逻辑）
    return {
      x: (clientX - rect.left) * (img.naturalWidth / rect.width),
      y: (clientY - rect.top) * (img.naturalHeight / rect.height),
    }
  }

  const startDrag = (
    e: React.MouseEvent | React.TouchEvent,
    type: 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
  ) => {
    e.preventDefault()
    e.stopPropagation()
    const pos = getPos(e)
    dragRef.current = {
      type,
      startX: pos.x,
      startY: pos.y,
      origCrop: { ...pendingCrop.current },
      origOffset: { ...pendingOffset.current },
    }
  }

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    const drag = dragRef.current
    if (!drag) return
    e.preventDefault()
    const pos = getPos(e)
    const dx = pos.x - drag.startX
    const dy = pos.y - drag.startY
    const MIN = 40

    let { x, y, w, h } = drag.origCrop
    let { x: ox, y: oy } = drag.origOffset

    if (drag.type === 'move') {
      // 整体移动图片：限制不能让图片完全离开裁剪框
      ox = drag.origOffset.x + dx
      oy = drag.origOffset.y + dy
      // 图片左上角不能跑到裁剪框右下角右边/下边
      // 图片右下角不能跑到裁剪框左上角左边/上边
      const maxX = Math.max(0, x + w - imgSize.w)
      const minX = Math.min(0, x)
      const maxY = Math.max(0, y + h - imgSize.h)
      const minY = Math.min(0, y)
      ox = Math.max(minX, Math.min(maxX, ox))
      oy = Math.max(minY, Math.min(maxY, oy))
    } else {
      if (drag.type.includes('w')) {
        const newX = Math.max(0, Math.min(x + w - MIN, x + dx))
        w = w - (newX - x)
        x = newX
      }
      if (drag.type.includes('e')) {
        w = Math.max(MIN, Math.min(imgSize.w - x, w + dx))
      }
      if (drag.type.includes('n')) {
        const newY = Math.max(0, Math.min(y + h - MIN, y + dy))
        h = h - (newY - y)
        y = newY
      }
      if (drag.type.includes('s')) {
        h = Math.max(MIN, Math.min(imgSize.h - y, h + dy))
      }
    }

    schedule({ x, y, w, h }, { x: ox, y: oy })
  }

  const endDrag = () => {
    dragRef.current = null
  }

  // 直接内嵌裁剪，不依赖外部 cropImage
  const handleConfirm = async () => {
    if (!imgRef.current || crop.w <= 0 || crop.h <= 0) return
    const img = imgRef.current
    setProcessing(true)
    try {
      // 计算原图上的裁剪区域（考虑图片偏移）
      let sx = crop.x - imgOffset.x
      let sy = crop.y - imgOffset.y
      let sw = crop.w
      let sh = crop.h

      // 限制在图片范围内
      sx = Math.max(0, sx)
      sy = Math.max(0, sy)
      sw = Math.min(img.naturalWidth - sx, sw)
      sh = Math.min(img.naturalHeight - sy, sh)

      if (sw <= 0 || sh <= 0) throw new Error('裁剪区域无效')

      const canvas = document.createElement('canvas')
      canvas.width = Math.round(sw)
      canvas.height = Math.round(sh)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas 不可用')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      // 生成缩略图
      const thumb = await makeThumb(canvas)
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
    setCrop({ x: imgSize.w * 0.1, y: imgSize.h * 0.1, w: imgSize.w * 0.8, h: imgSize.h * 0.8 })
    setImgOffset({ x: 0, y: 0 })
  }

  // 从 canvas 生成缩略图
  const makeThumb = (canvas: HTMLCanvasElement): Promise<string> => {
    return new Promise((resolve) => {
      const max = 280
      const ratio = Math.min(1, max / Math.max(canvas.width, canvas.height))
      const w = Math.round(canvas.width * ratio)
      const h = Math.round(canvas.height * ratio)
      const tc = document.createElement('canvas')
      tc.width = w
      tc.height = h
      const tctx = tc.getContext('2d')
      if (!tctx) return resolve(canvas.toDataURL('image/jpeg', 0.92))
      tctx.imageSmoothingEnabled = true
      tctx.imageSmoothingQuality = 'medium'
      tctx.drawImage(canvas, 0, 0, w, h)
      resolve(tc.toDataURL('image/jpeg', 0.7))
    })
  }

  // 容器视觉大小：CSS 缩放显示，但逻辑坐标是 natural 尺寸
  return (
    <div className="crop-modal-overlay" onClick={onCancel}>
      <div className="crop-modal" onClick={e => e.stopPropagation()}>
        <div className="crop-modal-header">
          <h3>裁剪图片</h3>
          <button className="crop-close-btn" onClick={onCancel} aria-label="取消">×</button>
        </div>
        <div className="crop-modal-body">
          <p className="crop-tip">拖动四角/四边调整区域，框内按住可移动图片</p>
          <div className="crop-scroll">
            <div
              className="crop-img-wrap"
              onMouseMove={onMove}
              onMouseUp={endDrag}
              onMouseLeave={endDrag}
              onTouchMove={onMove}
              onTouchEnd={endDrag}
              style={{ width: imgSize.w, height: imgSize.h }}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="待裁剪"
                className="crop-img"
                draggable={false}
                onLoad={() => setImgLoaded(true)}
                style={{ transform: `translate(${imgOffset.x}px, ${imgOffset.y}px)` }}
              />
              {imgLoaded && crop.w > 0 && (
                <>
                  {/* 遮罩：裁剪框外的四个矩形 */}
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
                    <div className="crop-grid-h" style={{ top: '33.33%' }} />
                    <div className="crop-grid-h" style={{ top: '66.66%' }} />
                    <div className="crop-grid-v" style={{ left: '33.33%' }} />
                    <div className="crop-grid-v" style={{ left: '66.66%' }} />

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
