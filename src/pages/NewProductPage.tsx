import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { GlassCard, GlassInput, VoiceWave, SuccessAnimation, useToast } from '@/components/ui'
import { useSTT } from '@/hooks/useSTT'
import { useTTS } from '@/hooks/useTTS'
import { productApi } from '@/api'

interface WizardStep {
  key: string
  label: string
  field: keyof typeof INITIAL_VALUES
  required: boolean
  autoAdvance?: boolean
}

const STEPS: WizardStep[] = [
  { key: 'name', label: 'Nombre del producto', field: 'name', required: true },
  { key: 'brand', label: 'Marca', field: 'brand', required: false, autoAdvance: true },
  { key: 'category', label: 'Categoría', field: 'category', required: false, autoAdvance: true },
  { key: 'presentation', label: 'Presentación', field: 'presentation', required: false, autoAdvance: true },
  { key: 'unit', label: 'Unidad de medida', field: 'unit', required: false, autoAdvance: true },
]

const INITIAL_VALUES = {
  name: '',
  brand: '',
  category: '',
  presentation: '',
  unit: '',
}

export function NewProductPage() {
  const { barcode } = useParams<{ barcode: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { isListening, transcript, interimTranscript, start, stop, isSupported, error, reset } = useSTT()
  const { speak } = useTTS()

  const [currentStep, setCurrentStep] = useState(0)
  const [values, setValues] = useState(INITIAL_VALUES)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    speak('Producto nuevo. Di el nombre del producto.')
  }, [])

  useEffect(() => {
    if (!transcript) return

    const step = STEPS[currentStep]
    setValues((prev) => ({ ...prev, [step.field]: transcript }))

    if (step.autoAdvance && step.required === false) {
      setTimeout(() => {
        if (currentStep < STEPS.length - 1) {
          setCurrentStep((prev) => prev + 1)
        }
      }, 600)
    }
  }, [transcript])

  const handleVoice = () => {
    reset()
    start()
  }

  const handleNext = () => {
    const step = STEPS[currentStep]

    if (step.required && !values[step.field].trim()) {
      showToast({ variant: 'error', message: `El campo "${step.label}" es obligatorio` })
      return
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleSave()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSave = useCallback(async () => {
    if (!barcode) return

    if (!values.name.trim()) {
      showToast({ variant: 'error', message: 'El nombre es obligatorio' })
      setCurrentStep(0)
      return
    }

    setIsSaving(true)

    try {
      await productApi.create({
        barcode,
        ...values,
      })

      setShowSuccess(true)
      speak('Producto creado exitosamente')

      setTimeout(() => {
        navigate('/', { replace: true })
      }, 3000)
    } catch {
      showToast({ variant: 'error', message: 'Error al crear producto' })
    } finally {
      setIsSaving(false)
    }
  }, [barcode, values, navigate, speak, showToast])

  const step = STEPS[currentStep]

  return (
    <div className="h-full flex flex-col bg-transparent">
      {showSuccess && (
        <SuccessAnimation
          message="Producto creado"
          subMessage={values.name}
          onComplete={() => setShowSuccess(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </button>
        <div className="flex-1">
          <h1 className="text-white text-lg font-semibold">Nuevo Producto</h1>
          <p className="text-white/50 text-xs font-mono">{barcode}</p>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 px-4 py-3">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`
              h-2 rounded-full transition-all duration-300
              ${i === currentStep
                ? 'w-8 bg-[#4F8CFF]'
                : i < currentStep
                  ? 'w-2 bg-[#2ECC71]'
                  : 'w-2 bg-white/20'
              }
            `}
          />
        ))}
      </div>

      {/* Product preview */}
      <div className="px-4 pb-3">
        <GlassCard className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">
              {values.name || 'Sin nombre'}
            </p>
            <p className="text-white/50 text-sm truncate">
              {[values.brand, values.category].filter(Boolean).join(' • ') || 'Sin detalles'}
            </p>
          </div>
          {values.presentation && (
            <span className="text-white/40 text-xs">{values.presentation}</span>
          )}
        </GlassCard>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.key}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <GlassCard elevated>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-white/70 text-sm font-medium">
                    Paso {currentStep + 1} de {STEPS.length}
                  </p>
                  {step.required && (
                    <span className="text-[#FF5A5F] text-xs">Requerido</span>
                  )}
                </div>

                <GlassInput
                  label={step.label}
                  value={values[step.field]}
                  onChange={(val) => setValues((prev) => ({ ...prev, [step.field]: val }))}
                  placeholder={`Ingresa ${step.label.toLowerCase()}...`}
                />

                {/* Voice control */}
                <div className="flex flex-col items-center gap-3 pt-4">
                  {isListening && <VoiceWave active />}

                  <button
                    onClick={isListening ? stop : handleVoice}
                    disabled={!isSupported}
                    className={`
                      w-16 h-16 rounded-full
                      flex items-center justify-center
                      transition-all duration-300
                      ${isListening
                        ? 'bg-[#FF5A5F] shadow-[0_0_30px_rgba(255,90,95,0.5)] animate-pulse-scan'
                        : 'bg-[#4F8CFF] hover:bg-[#3A6FD8] shadow-[0_4px_20px_rgba(79,140,255,0.3)]'
                      }
                      disabled:opacity-50
                    `}
                  >
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M12 2C10.34 2 9 3.34 9 5V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V5C15 3.34 13.66 2 12 2Z" />
                      <path d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10" />
                      <path d="M12 19V22" />
                    </svg>
                  </button>

                  <p className="text-white/50 text-sm text-center">
                    {isListening
                      ? interimTranscript || `Di ${step.label.toLowerCase()}...`
                      : 'Toca para hablar'}
                  </p>
                </div>

                {error && (
                  <p className="text-[#FF5A5F] text-sm text-center">{error}</p>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-4">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white/70 font-medium transition-colors"
            >
              Atrás
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={isSaving}
            className={`
              flex-1 py-3 rounded-xl font-medium
              flex items-center justify-center gap-2
              transition-all duration-200
              ${currentStep === STEPS.length - 1
                ? 'bg-[#2ECC71] hover:bg-[#27AE60] text-white'
                : 'bg-[#4F8CFF] hover:bg-[#3A6FD8] text-white'
              }
              disabled:opacity-50
            `}
          >
            {currentStep === STEPS.length - 1 ? (
              <>
                <Check className="w-5 h-5" />
                {isSaving ? 'Guardando...' : 'Guardar'}
              </>
            ) : (
              'Siguiente'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
