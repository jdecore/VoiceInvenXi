import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Search } from 'lucide-react'
import { Header, Card, Input, FAB, VoiceWave, Skeleton, EmptyState, NavBar, StockBadge, useToast } from '@/components/ui'
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
  const debounceRef = useRef<number | null>(null)

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

  const handleTextChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)

    debounceRef.current = window.setTimeout(() => {
      if (value.trim()) {
        performSearch(value)
      } else {
        setResults([])
        setHasSearched(false)
      }
    }, 400)
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
        <div className="pt-1">
          <Input
            label="Buscar producto"
            placeholder="Escribe o usa el micrófono..."
            icon={<Search className="w-4 h-4" />}
            value={query}
            onChange={(e) => handleTextChange(e.target.value)}
          />
        </div>

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
              <Card key={result.id} interactive onClick={() => handleResultClick(result)}>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-on-surface font-medium truncate">{result.name}</p>
                    <p className="text-on-surface-muted text-sm truncate">
                      {result.brand} {result.category && `• ${result.category}`}
                    </p>
                  </div>
                  <StockBadge stock={result.stock} unit={result.unit} size="sm" />
                </div>
              </Card>
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
