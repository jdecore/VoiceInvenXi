import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { generateRandomBarcode } from '@/lib/barcode'

export function ScanPageRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate(`/new/${generateRandomBarcode()}`, { replace: true })
  }, [navigate])

  return null
}