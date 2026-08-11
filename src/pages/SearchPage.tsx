import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, Search, Mic } from 'lucide-react'
import { motion } from 'motion/react'
import { GlassCard, TelegramNav, VoiceWave, SkeletonLoader, EmptyState, useToast } from '@/components/ui'
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
      showToast({ variant: 'error', message: 'Error al buscar productos' })
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
    <div className="h-full flex flex-col bg-transparent">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </button>
        <h1 className="text-white text-lg font-semibold flex-1">Búsqueda</h1>
      </div>

      {/* Mic button */}
      {isSupported && (
        <div className="flex flex-col items-center gap-3 px-4 py-4">
          <button
            onClick={handleMic}
            className={`
              w-20 h-20 rounded-full
              flex items-center justify-center
              transition-all duration-300
              ${isListening
                ? 'bg-[#FF5A5F] shadow-[0_0_40px_rgba(255,90,95,0.5)] animate-pulse-scan'
                : 'bg-[#4F8CFF] hover:bg-[#3A6FD8] shadow-[0_4px_24px_rgba(79,140,255,0.4)]'
              }
            `}
          >
            <Mic className="w-8 h-8 text-white" />
          </button>
          <p className="text-white/50 text-sm text-center">
            {isListening
              ? interimTranscript || 'Di algo para buscar...'
              : 'Toca para buscar por voz'}
          </p>
        </div>
      )}

      {/* Voice feedback */}
      {isListening && (
        <div className="flex flex-col items-center gap-2 px-4 pb-4">
          <VoiceWave active={isListening} />
        </div>
      )}

      {/* Query display */}
      {query && !isListening && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06]">
            <Search className="w-4 h-4 text-white/40" />
            <span className="text-white/70 text-sm">{query}</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mx-4 mb-3 p-3 rounded-xl bg-[#FF5A5F]/10 border border-[#FF5A5F]/20">
          <p className="text-[#FF5A5F] text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <SkeletonLoader key={i} className="h-20" />
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
                <GlassCard
                  interactive
                  onClick={() => handleResultClick(result)}
                  className="flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{result.name}</p>
                    <p className="text-white/50 text-sm truncate">
                      {result.brand} {result.category && `• ${result.category}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#4F8CFF] text-sm font-semibold">
                      {Math.round(result.score * 100)}%
                    </p>
                    <p className="text-white/40 text-xs">Stock: {result.stock}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Initial state */}
        {!hasSearched && !isLoading && (
          <EmptyState
            icon={<Search className="w-8 h-8 text-white/30" />}
            title="Busca productos"
            description="Toca el micrófono y di lo que buscas"
          />
        )}
      </div>

      <TelegramNav hideMic />
    </div>
  )
}
