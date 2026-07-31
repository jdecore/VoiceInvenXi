import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Mic, Search, Package } from 'lucide-react'
import { searchApi } from '@/api'
import { useSTT } from '@/hooks/useSTT'
import { useTTS } from '@/hooks/useTTS'
import type { SemanticSearchResult } from '@/types'
import styles from './SearchPageText.module.css'

export default function SearchPageText() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SemanticSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { isListening, transcript, start, stop, isSupported } = useSTT()
  const { speak } = useTTS()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (transcript) {
      setQuery(transcript)
    }
  }, [transcript])

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query
    if (!q.trim()) return

    setLoading(true)
    setError(null)
    setSearched(true)

    try {
      const data = await searchApi.semanticSearch(q.trim())
      setResults(data.results)
      if (data.results.length === 0) {
        speak('No se encontraron productos')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch()
  }

  const handleMicToggle = () => {
    if (isListening) {
      stop()
    } else {
      start()
    }
  }

  const handleResultClick = (barcode: string) => {
    navigate(`/product/${barcode}`)
  }

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button className={styles.backButton} onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>Buscar por nombre</h1>
      </motion.div>

      <motion.form
        className={styles.searchForm}
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className={styles.inputGroup}>
          <div className={styles.inputWrapper}>
            <Search size={18} className={styles.inputIcon} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: aceite de oliva, leche..."
              className={styles.input}
              disabled={loading}
            />
          </div>
          {isSupported && (
            <button
              type="button"
              className={`${styles.micButton} ${isListening ? styles.micActive : ''}`}
              onClick={handleMicToggle}
              disabled={loading}
            >
              <Mic size={20} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={loading || !query.trim()}
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </motion.form>

      {isListening && (
        <motion.div
          className={styles.listeningHint}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Escuchando... habla ahora
        </motion.div>
      )}

      {error && (
        <motion.div
          className={styles.error}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.div>
      )}

      <div className={styles.resultsContainer}>
        <AnimatePresence mode="popLayout">
          {results.map((item, i) => (
            <motion.button
              key={item.barcode}
              className={styles.resultCard}
              onClick={() => handleResultClick(item.barcode)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <div className={styles.resultIcon}>
                <Package size={20} />
              </div>
              <div className={styles.resultInfo}>
                <span className={styles.resultName}>{item.name}</span>
                <span className={styles.resultMeta}>
                  {[item.brand, item.category, item.presentation].filter(Boolean).join(' · ')}
                </span>
              </div>
              <span className={styles.resultScore}>
                {(item.score * 100).toFixed(0)}%
              </span>
            </motion.button>
          ))}
        </AnimatePresence>

        {searched && !loading && results.length === 0 && !error && (
          <motion.div
            className={styles.emptyState}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Package size={40} className={styles.emptyIcon} />
            <span>No se encontraron productos</span>
          </motion.div>
        )}
      </div>
    </div>
  )
}
