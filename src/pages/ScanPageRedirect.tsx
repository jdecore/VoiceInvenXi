import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { MOCK_PRODUCTS } from '@/constants'

export function ScanPageRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    const randomProduct = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)]
    navigate(`/new/${randomProduct.barcode}`, { replace: true })
  }, [navigate])

  return null
}
