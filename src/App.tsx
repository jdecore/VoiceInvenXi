import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import { AnimatePresence } from 'motion/react'
import PhoneFrame from '@/components/PhoneFrame'
import ErrorBoundary from '@/components/ErrorBoundary'
import ToastProvider from '@/components/Toast'
import SplashScreen from '@/components/SplashScreen'
import LoadingDots from '@/components/LoadingDots'
import '@/styles/globals.css'
import '@/styles/animations.css'
import styles from './App.module.css'

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
  const [showSplash, setShowSplash] = useState(true)

  return (
    <>
      <div className={styles.ambient} aria-hidden="true">
        <span className={`${styles.blob} ${styles.blob1}`} />
        <span className={`${styles.blob} ${styles.blob2}`} />
        <span className={`${styles.blob} ${styles.blob3}`} />
      </div>

      <div className={styles.appShell}>
        <AnimatePresence>
          {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
        </AnimatePresence>

        <ToastProvider>
          <ErrorBoundary>
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
          </ErrorBoundary>
        </ToastProvider>
      </div>
    </>
  )
}
