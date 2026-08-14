import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
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
    <div className="flex items-center justify-center h-full bg-surface">
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-brand animate-[dot-bounce_1.2s_ease-in-out_infinite]" />
        <div className="w-2 h-2 rounded-full bg-brand animate-[dot-bounce_1.2s_ease-in-out_infinite_0.15s]" />
        <div className="w-2 h-2 rounded-full bg-brand animate-[dot-bounce_1.2s_ease-in-out_infinite_0.3s]" />
      </div>
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="h-full"
      >
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
      </motion.div>
    </AnimatePresence>
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