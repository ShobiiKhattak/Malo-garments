import { useState, useEffect, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'
interface ToastItem { id: number; message: string; type: ToastType }

let externalShow: ((message: string, type?: ToastType) => void) | null = null

export function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200)
  }, [])

  useEffect(() => { externalShow = show }, [show])

  const colors: Record<ToastType, string> = { success: '#2ecc71', error: '#e74c3c', info: '#3498db', warning: '#f39c12' }

  return (
    <div style={{position:'fixed',bottom:'86px',right:'16px',zIndex:9999,display:'flex',flexDirection:'column',gap:'8px'}}>
      {toasts.map(t => (
        <div key={t.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'14px 24px',borderRadius:'10px',color:'white',background:colors[t.type]||colors.info,boxShadow:'0 8px 30px rgba(0,0,0,0.18)',animation:'slideIn 0.3s ease',maxWidth:'400px',fontSize:'0.9rem',fontWeight:500}}>
          {t.type==='success'?'✓':t.type==='error'?'✕':t.type==='warning'?'⚠':'ℹ'} {t.message}
        </div>
      ))}
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}

export const showToast = (message: string, type?: ToastType) => externalShow?.(message, type)
export default Toast
