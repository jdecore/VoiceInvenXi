import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Search, Sparkles } from 'lucide-react'
import { PageLayout, Header, Card, Input, FAB, VoiceWave, Skeleton, EmptyState, ProductRow, useToast } from '@/components/ui'
import { useSTT } from '@/hooks/useSTT'
import { searchApi } from '@/api'
import { MOCK_PRODUCTS } from '@/constants'
import type { SemanticSearchResult } from '@/types'

const SUGGESTIONS = MOCK_PRODUCTS.slice(0, 4).map((p) => p.name)

export function SearchPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()
  const { isListening, transcript, interimTranscript, start, stop, isSupported, error } = useSTT()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SemanticSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [hasError, setHasError] = useState(false)
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
    setHasError(false)

    try {
      const response = await searchApi.semanticSearch(searchQuery)
      setResults(response.results)
    } catch {
      setHasError(true)
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
        setHasError(false)
      }
    }, 400)
  }

  const handleSuggestion = (suggestion: string) => {
    setQuery(suggestion)
    performSearch(suggestion)
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
    <PageLayout
      nav
      navExtra={<FAB isListening={isListening} onClick={handleMic} />}
      header={<Header title="Búsqueda" subtitle={results.length > 0 ? `${results.length} resultados` : undefined} showBack />}
      contentClassName="px-4 pb-[calc(10%+8rem)]"
    >
      <div className="pt-1">
        <Input
          label="Buscar producto"
          placeholder="Escribe o usa el micrófono..."
          icon={<Search className="w-4 h-4" />}
          value={query}
          onChange={(e) => handleTextChange(e.target.value)}
        />
      </div>

      {isListening && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface-1 border border-outline-variant/50 px-4 py-3">
          <VoiceWave active />
          <p className="flex-1 text-on-surface-muted text-sm truncate">
            {interimTranscript || 'Di algo para buscar...'}
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-error-container border border-error/20">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      {!hasSearched && !isLoading && (
        <div className="mt-5">
          <div className="flex items-center gap-1.5 text-on-surface-muted text-xs font-medium uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            Sugerencias
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestion(suggestion)}
                className="px-3.5 py-2 rounded-full bg-surface-1 border border-outline-variant/50
                  text-on-surface text-sm font-medium
                  hover:bg-surface-2 active:bg-surface-3
                  transition-colors duration-150 active:scale-95"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="mt-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : hasError ? null : hasSearched && results.length === 0 ? (
        <EmptyState
          icon={<Search className="w-8 h-8 text-on-surface-muted" />}
          title={query ? `No encontramos "${query}"` : 'Sin resultados'}
          description="Prueba con otras palabras o usa el micrófono para buscar por voz"
        />
      ) : (
        <div className="mt-5 space-y-3">
          {results.map((result) => (
            <Card key={result.id} interactive onClick={() => handleResultClick(result)}>
              <ProductRow
                name={result.name}
                meta={`${result.brand} ${result.category && `• ${result.category}`}`}
                stock={result.stock}
                unit={result.unit}
              />
            </Card>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
