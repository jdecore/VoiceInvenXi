import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Check } from 'lucide-react'
import { PageLayout, Header, Card, Input, Button, VoiceWave, SuccessAnimation, useToast } from '@/components/ui'
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
      showToast('error', `El campo "${step.label}" es obligatorio`)
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
      showToast('error', 'El nombre es obligatorio')
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
      showToast('error', 'Error al crear producto')
    } finally {
      setIsSaving(false)
    }
  }, [barcode, values, navigate, speak, showToast])

  const step = STEPS[currentStep]

  return (
    <PageLayout>
      <div className="relative flex-1 overflow-y-auto">
        {showSuccess && (
          <SuccessAnimation
            message="Producto creado"
            subMessage={values.name}
            onComplete={() => setShowSuccess(false)}
          />
        )}

        <Header title="Nuevo Producto" subtitle={barcode} />

        <div className="flex items-center justify-center gap-2 px-4 py-3">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`
                h-1.5 rounded-full transition-all duration-300
                ${i === currentStep
                  ? 'w-8 bg-brand'
                  : i < currentStep
                    ? 'w-3 bg-success'
                    : 'w-3 bg-surface-3'
                }
              `}
            />
          ))}
        </div>

        <div className="px-4 pb-3">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="text-on-surface-variant text-sm font-medium">
                Paso {currentStep + 1} de {STEPS.length}
              </p>
              {step.required && (
                <span className="text-error text-xs font-medium">Requerido</span>
              )}
            </div>

            <Input
              label={step.label}
              value={values[step.field]}
              onChange={(e) => setValues((prev) => ({ ...prev, [step.field]: e.target.value }))}
              placeholder={`Ingresa ${step.label.toLowerCase()}...`}
            />

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
                    ? 'bg-error text-white shadow-lg shadow-error/30 animate-pulse-mic'
                    : 'bg-brand text-white hover:bg-brand-dark shadow-lg shadow-brand/30'
                  }
                  disabled:opacity-50
                `}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2C10.34 2 9 3.34 9 5V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V5C15 3.34 13.66 2 12 2Z" />
                  <path d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10" />
                  <path d="M12 19V22" />
                </svg>
              </button>

              <p className="text-on-surface-muted text-sm text-center">
                {isListening
                  ? interimTranscript || `Di ${step.label.toLowerCase()}...`
                  : 'Toca para hablar'}
              </p>
            </div>

            {error && (
              <p className="text-error text-sm text-center mt-2">{error}</p>
            )}
          </Card>
        </div>

        <div className="flex gap-3 px-4 py-4 pb-8">
          {currentStep > 0 && (
            <Button variant="outlined" className="flex-1" onClick={handleBack}>
              Atrás
            </Button>
          )}
          <Button
            variant={currentStep === STEPS.length - 1 ? 'filled' : 'filled'}
            className="flex-1"
            onClick={handleNext}
            disabled={isSaving}
          >
            {currentStep === STEPS.length - 1 ? (
              <>
                <Check className="w-4 h-4" />
                {isSaving ? 'Guardando...' : 'Guardar'}
              </>
            ) : (
              'Siguiente'
            )}
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}
