// 图片处理工具：无损压缩 + 缩略图
// 设计原则：原图通过canvas重绘到合理尺寸，保持图推细节清晰

// 压缩图片：限制最长边到maxSize，质量保持高保真
// 图推题目图形细节重要，因此质量设为0.92，最长边不超过1600px
export function compressImage(
  file: File | Blob,
  maxSize = 1600,
  quality = 0.92
): Promise<{ dataUrl: string; thumb: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        try {
          const { width, height } = img
          const ratio = Math.min(1, maxSize / Math.max(width, height))
          const targetW = Math.round(width * ratio)
          const targetH = Math.round(height * ratio)

          const canvas = document.createElement('canvas')
          canvas.width = targetW
          canvas.height = targetH
          const ctx = canvas.getContext('2d')
          if (!ctx) throw new Error('Canvas context不可用')
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, targetW, targetH)

          const dataUrl = canvas.toDataURL('image/jpeg', quality)
          // 缩略图：固定最长边280px，用于列表预览，减少渲染压力
          const thumb = makeThumbnail(img, 280)

          resolve({ dataUrl, thumb, width: targetW, height: targetH })
        } catch (err) {
          reject(err)
        }
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

// 生成缩略图
function makeThumbnail(img: HTMLImageElement, maxSide: number): string {
  const ratio = Math.min(1, maxSide / Math.max(img.width, img.height))
  const w = Math.round(img.width * ratio)
  const h = Math.round(img.height * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'medium'
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.7)
}

// 裁剪图片：根据坐标裁剪出指定区域，预留安全边距防止丢失内容
// safePadPercent: 安全边距百分比（相对裁剪框），避免裁掉选项序号
export function cropImage(
  imageSrc: string,
  cropX: number,
  cropY: number,
  cropW: number,
  cropH: number,
  naturalW: number,
  naturalH: number,
  safePadPercent = 0.04
): Promise<{ dataUrl: string; thumb: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        // 比例转换：从显示坐标到自然坐标
        const scaleX = img.naturalWidth / naturalW
        const scaleY = img.naturalHeight / naturalH

        let sx = cropX * scaleX
        let sy = cropY * scaleY
        let sw = cropW * scaleX
        let sh = cropH * scaleY

        // 应用安全边距：向四周扩展
        const padX = sw * safePadPercent
        const padY = sh * safePadPercent
        sx = Math.max(0, sx - padX)
        sy = Math.max(0, sy - padY)
        sw = Math.min(img.naturalWidth - sx, sw + 2 * padX)
        sh = Math.min(img.naturalHeight - sy, sh + 2 * padY)

        const canvas = document.createElement('canvas')
        canvas.width = Math.round(sw)
        canvas.height = Math.round(sh)
        const ctx = canvas.getContext('2d')!
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
        // 用同一canvas生成缩略图
        const thumbImg = new Image()
        thumbImg.onload = () => {
          const thumb = makeThumbnail(thumbImg, 280)
          resolve({ dataUrl, thumb })
        }
        thumbImg.onerror = () => resolve({ dataUrl, thumb: dataUrl })
        thumbImg.src = dataUrl
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('裁剪：图片加载失败'))
    img.src = imageSrc
  })
}

// 读取文件为dataUrl
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

// 格式化字节大小
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
}
