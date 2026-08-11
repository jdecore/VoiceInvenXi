import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Search } from 'lucide-react'
import { motion } from 'motion/react'
import { Header, Card, FAB, VoiceWave, Skeleton, EmptyState, NavBar, useToast } from '@/components/ui'
import { useSTT } from '@/hooks/useSTT'
import { searchApi } from '@/api'
import type { SemanticSearchResult } from '@/types'

export function SearchPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()
  const { isListening, transcript, interimTranscript, start, stop, isSupported, error } = useSTT()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SemanticSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    if (searchParams.get('voice') === 'true' && isSupported) {
      start()
    }
  }, [searchParams, isSupported])

  useEffect(() => {
    if (transcript) {
      setQuery(transcript)
      performSearch(transcript)
    }
  }, [transcript])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setHasSearched(true)

    try {
      const response = await searchApi.semanticSearch(searchQuery)
      setResults(response.results)
    } catch {
      showToast('error', 'Error al buscar productos')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleMic = () => {
    if (isListening) {
      stop()
    } else {
      start()
    }
  }

  const handleResultClick = (result: SemanticSearchResult) => {
    navigate(`/product/${result.barcode}`)
  }

  return (
    <div className="relative h-full flex flex-col bg-surface overflow-hidden">
      <Header title="Búsqueda" showBack />

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="flex flex-col items-center gap-3 py-4">
          <FAB isListening={isListening} onClick={handleMic} />
          <p className="text-on-surface-muted text-sm">
            {isListening
              ? interimTranscript || 'Di algo para buscar...'
              : 'Toca el micrófono para buscar'}
          </p>
        </div>

        {isListening && (
          <div className="flex justify-center pb-4">
            <VoiceWave active />
          </div>
        )}

        {query && !isListening && (
          <div className="mb-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-2">
              <Search className="w-4 h-4 text-on-surface-muted" />
              <span className="text-on-surface text-sm">{query}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-error-container border border-error/20">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : hasSearched && results.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            description="No se encontraron productos que coincidan con tu búsqueda"
          />
        ) : (
          <div className="space-y-3">
            {results.map((result) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card interactive onClick={() => handleResultClick(result)}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-on-surface font-medium truncate">{result.name}</p>
                      <p className="text-on-surface-muted text-sm truncate">
                        {result.brand} {result.category && `• ${result.category}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-brand text-sm font-semibold">
                        {Math.round(result.score * 100)}%
                      </p>
                      <p className="text-on-surface-muted text-xs">Stock: {result.stock}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {!hasSearched && !isLoading && (
          <EmptyState
            icon={<Search className="w-8 h-8 text-on-surface-muted" />}
            title="Busca productos"
            description="Toca el micrófono y di lo que buscas"
          />
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center px-4 py-4 pb-[env(safe-area-inset-bottom)]">
        <NavBar />
      </div>
    </div>
  )
}
