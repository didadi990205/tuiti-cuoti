import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import UploadModal from '@/components/UploadModal'

// /upload 路由：直接唤起统一上传弹窗
export default function UploadPage() {
  const [open, setOpen] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    setOpen(true)
  }, [])

  const handleClose = () => {
    setOpen(false)
    navigate('/library')
  }

  return <UploadModal open={open} onClose={handleClose} />
}
