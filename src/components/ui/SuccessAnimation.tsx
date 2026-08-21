import { Check } from 'lucide-react'
import { hapticSuccess } from '@/lib/haptics'
import { useEffect } from 'react'

interface SuccessAnimationProps {
  message: string
  subMessage?: string
  onComplete?: () => void
  duration?: number
}

export function SuccessAnimation({
  message,
  subMessage,
  onComplete,
  duration = 2500,
}: SuccessAnimationProps) {
  useEffect(() => {
    hapticSuccess()
    const timer = setTimeout(() => onComplete?.(), duration)
    return () => clearTimeout(timer)
  }, [duration, onComplete])

  return (
    <div className="success-overlay">
      <div className="success-check-wrap">
        <div className="success-ripple" />
        <div className="success-check">
          <Check />
        </div>
      </div>
      <div className="success-msg">
        <p className="success-msg-title">{message}</p>
        {subMessage && <p className="success-msg-sub">{subMessage}</p>}
      </div>
    </div>
  )
}
