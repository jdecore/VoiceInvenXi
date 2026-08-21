import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router'
import { ErrorBoundary, ToastProvider, ToastHost, PhoneFrame } from '@/components/ui'

const ScanPage = lazy(() => import('@/pages/ScanPage').then(m => ({ default: m.ScanPage })))
const SearchPage = lazy(() => import('@/pages/SearchPage').then(m => ({ default: m.SearchPage })))
const ProductPage = lazy(() => import('@/pages/ProductPage').then(m => ({ default: m.ProductPage })))
const NewProductPage = lazy(() => import('@/pages/NewProductPage').then(m => ({ default: m.NewProductPage })))
const InventoryPage = lazy(() => import('@/pages/InventoryPage').then(m => ({ default: m.InventoryPage })))
const ActivityPage = lazy(() => import('@/pages/ActivityPage').then(m => ({ default: m.ActivityPage })))
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const ScanPageRedirect = lazy(() => import('@/pages/ScanPageRedirect').then(m => ({ default: m.ScanPageRedirect })))

function LoadingFallback() {
  return (
    <div className="loading-dots">
      <span />
      <span />
      <span />
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <div key={location.pathname} className="animate-route-fade h-full">
      <Suspense fallback={<LoadingFallback />}>
        <Routes location={location}>
          <Route path="/" element={<ScanPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/product/:barcode" element={<ProductPage />} />
          <Route path="/new/:barcode" element={<NewProductPage />} />
          <Route path="/new" element={<ScanPageRedirect />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <PhoneFrame>
            <ToastHost />
            <AnimatedRoutes />
          </PhoneFrame>
        </BrowserRouter>
      </ErrorBoundary>
    </ToastProvider>
  )
}
