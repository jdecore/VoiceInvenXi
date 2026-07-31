import { BrowserRouter, Routes, Route } from 'react-router'
import { lazy, Suspense } from 'react'
import PhoneFrame from '@/components/PhoneFrame'
import LoadingDots from '@/components/LoadingDots'
import '@/styles/globals.css'
import '@/styles/animations.css'

const SearchPage = lazy(() => import('@/pages/SearchPage'))
const SearchPageText = lazy(() => import('@/pages/SearchPageText'))
const ProductPage = lazy(() => import('@/pages/ProductPage'))
const NewProductPage = lazy(() => import('@/pages/NewProductPage'))

function LoadingFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <LoadingDots text="Cargando..." />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <PhoneFrame>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/search-text" element={<SearchPageText />} />
            <Route path="/product/:barcode" element={<ProductPage />} />
            <Route path="/new/:barcode" element={<NewProductPage />} />
          </Routes>
        </Suspense>
      </PhoneFrame>
    </BrowserRouter>
  )
}
