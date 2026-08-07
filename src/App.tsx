import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import { AnimatePresence } from 'motion/react'
import { PhoneFrame, ErrorBoundary, ToastProvider, SplashScreen } from '@/components/ui'

const ScanPage = lazy(() => import('@/pages/ScanPage').then(m => ({ default: m.ScanPage })))
const SearchPage = lazy(() => import('@/pages/SearchPage').then(m => ({ default: m.SearchPage })))
const ProductPage = lazy(() => import('@/pages/ProductPage').then(m => ({ default: m.ProductPage })))
const NewProductPage = lazy(() => import('@/pages/NewProductPage').then(m => ({ default: m.NewProductPage })))
const InventoryPage = lazy(() => import('@/pages/InventoryPage').then(m => ({ default: m.InventoryPage })))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })))
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const ScanPageRedirect = lazy(() => import('@/pages/ScanPageRedirect').then(m => ({ default: m.ScanPageRedirect })))

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-white/40 animate-[dotBounce_1.2s_ease-in-out_infinite]" />
        <div className="w-2 h-2 rounded-full bg-white/40 animate-[dotBounce_1.2s_ease-in-out_infinite_0.15s]" />
        <div className="w-2 h-2 rounded-full bg-white/40 animate-[dotBounce_1.2s_ease-in-out_infinite_0.3s]" />
      </div>
    </div>
  )
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      </AnimatePresence>

      <ToastProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <PhoneFrame>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<ScanPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/product/:barcode" element={<ProductPage />} />
                  <Route path="/new/:barcode" element={<NewProductPage />} />
                  <Route path="/new" element={<ScanPageRedirect />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Routes>
              </Suspense>
            </PhoneFrame>
          </BrowserRouter>
        </ErrorBoundary>
      </ToastProvider>
    </>
  )
}
