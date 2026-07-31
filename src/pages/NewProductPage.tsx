import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Check, ChevronRight, Tag, Building2, LayoutGrid, Box, Scale, Package } from 'lucide-react'
import GlassButton from '@/components/GlassButton'
import GlassInput from '@/components/GlassInput'
import MicButton from '@/components/MicButton'
import VoiceWave from '@/components/VoiceWave'
import SuccessCheck from '@/components/SuccessCheck'
import LoadingDots from '@/components/LoadingDots'
import { useSTT } from '@/hooks/useSTT'
import { useTTS } from '@/hooks/useTTS'
import { productApi } from '@/api'
import styles from './NewProductPage.module.css'

interface FormData {
  name: string
  brand: string
  category: string
  presentation: string
  unit: string
}

const INITIAL_FORM: FormData = {
  name: '',
  brand: '',
  category: '',
  presentation: '',
  unit: '',
}

interface StepConfig {
  key: keyof FormData
  label: string
  icon: React.ReactNode
  required: boolean
  placeholder: string
}

const STEPS: StepConfig[] = [
  { key: 'name', label: 'Nombre del Producto', icon: <Tag size={18} />, required: true, placeholder: 'Ej: Aceite de Oliva' },
  { key: 'brand', label: 'Marca', icon: <Building2 size={18} />, required: false, placeholder: 'Ej: La Española' },
  { key: 'category', label: 'Categoría', icon: <LayoutGrid size={18} />, required: false, placeholder: 'Ej: Abarrotes' },
  { key: 'presentation', label: 'Presentación', icon: <Box size={18} />, required: false, placeholder: 'Ej: Botella 500ml' },
  { key: 'unit', label: 'Unidad de Medida', icon: <Scale size={18} />, required: false, placeholder: 'Ej: Unidad' },
]

export default function NewProductPage() {
  const { barcode } = useParams<{ barcode: string }>()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [validationError, setValidationError] = useState('')
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { isListening, transcript, interimTranscript, start, stop, isSupported, reset, error: sttError } =
    useSTT()
  const { speak: speakText } = useTTS()

  const currentStep = STEPS[step]
  const isLastStep = step === STEPS.length - 1

  const updateField = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setValidationError('')
  }, [])

  const handleMicPress = useCallback(() => {
    if (isListening) {
      stop()
    } else {
      reset()
      start()
    }
  }, [isListening, start, stop, reset])

  useEffect(() => {
    if (!isListening && transcript && !showSuccess && !isSaving) {
      updateField(currentStep.key, transcript)
      reset()

      if (!currentStep.required) {
        autoAdvanceTimerRef.current = setTimeout(() => {
          setDirection(1)
          setStep((prev) => Math.min(prev + 1, STEPS.length - 1))
        }, 600)
      }
    }
  }, [isListening, transcript, showSuccess, isSaving, currentStep.key, currentStep.required, updateField, reset])

  useEffect(() => {
    if (sttError) {
      setValidationError(sttError)
    }
  }, [sttError])

  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current)
    }
  }, [])

  const handleNext = useCallback(() => {
    if (currentStep.required && !form[currentStep.key].trim()) {
      setValidationError(`El campo "${currentStep.label}" es obligatorio`)
      speakText(`El campo ${currentStep.label} es obligatorio`)
      return
    }

    if (isLastStep) {
      handleSave()
      return
    }

    setDirection(1)
    setStep((prev) => prev + 1)
    setValidationError('')
  }, [currentStep, form, isLastStep, speakText])

  const handleBack = useCallback(() => {
    if (step > 0) {
      setDirection(-1)
      setStep((prev) => prev - 1)
      setValidationError('')
    }
  }, [step])

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      setValidationError('El nombre es obligatorio')
      speakText('El nombre es obligatorio')
      return
    }

    if (!barcode) {
      setValidationError('Código de barras no disponible')
      speakText('Código de barras no disponible')
      return
    }

    setIsSaving(true)
    try {
      await productApi.create({
        barcode,
        name: form.name,
        brand: form.brand,
        category: form.category,
        presentation: form.presentation,
        unit: form.unit,
      })
      setShowSuccess(true)
      speakText('Producto registrado correctamente')
    } catch {
      setValidationError('Error al guardar el producto')
      speakText('Error al guardar el producto')
    } finally {
      setIsSaving(false)
    }
  }, [form, barcode, speakText])

  const handleSuccessComplete = useCallback(() => {
    navigate('/')
  }, [navigate])

  const micStatusText = isListening
    ? (interimTranscript || 'Escuchando...')
    : (form[currentStep.key] ? 'Toca para cambiar' : 'Toca para hablar...')

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.topBar}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button className={styles.backButton} onClick={handleBack}>
          <ArrowLeft size={20} />
        </button>
        <span className={styles.logo}>VoiceInvenXi</span>
      </motion.div>

      <div className={styles.content}>
        <motion.div
          className={styles.wizardCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Header compacto del producto */}
          <div className={styles.productHeader}>
            <div className={styles.productThumb}>
              <Package size={24} />
            </div>
            <div className={styles.productInfo}>
              <span className={styles.productName}>
                {form.name || 'Nuevo Producto'}
              </span>
              <span className={styles.productMeta}>
                {[form.brand, form.category, form.presentation].filter(Boolean).join(' · ') || barcode}
              </span>
            </div>
          </div>

          {/* Indicador de paso */}
          <div className={styles.stepIndicator}>
            <span className={styles.stepTitle}>
              Paso {step + 1} de {STEPS.length}: {currentStep.label}
            </span>
            <div className={styles.stepDots}>
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`${styles.dot} ${i === step ? styles.dotActive : ''} ${i < step ? styles.dotCompleted : ''}`}
                />
              ))}
            </div>
          </div>

          {/* Área de interacción */}
          <div className={styles.stepBody}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                initial={{ opacity: 0, x: direction * 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -60 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={styles.stepContent}
              >
                <div className={styles.inputArea}>
                  <GlassInput
                    label={currentStep.label}
                    value={form[currentStep.key]}
                    onChange={(v) => updateField(currentStep.key, v)}
                    placeholder={currentStep.placeholder}
                    icon={currentStep.icon}
                  />
                </div>

                {isSupported && (
                  <div className={styles.micArea}>
                    <MicButton
                      isListening={isListening}
                      onClick={handleMicPress}
                      size={40}
                    />
                    <VoiceWave active={isListening} />
                    <span className={`${styles.micLabel} ${isListening ? styles.micLabelActive : ''}`}>
                      {micStatusText}
                    </span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer con acción */}
          <div className={styles.stepFooter}>
            {validationError && (
              <span className={styles.validationError}>{validationError}</span>
            )}

            {isSaving && <LoadingDots text="Guardando producto..." />}

            {!isSaving && !showSuccess && (
              <>
                {step > 0 && (
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    onClick={handleBack}
                  >
                    ← Atrás
                  </GlassButton>
                )}
                <GlassButton
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={isLastStep ? <Check size={22} /> : <ChevronRight size={22} />}
                  onClick={handleNext}
                  disabled={showSuccess || isSaving}
                >
                  {isLastStep ? 'Guardar Producto' : 'Confirmar →'}
                </GlassButton>
              </>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <SuccessCheck
            message="Producto registrado"
            subMessage="Correctamente"
            onComplete={handleSuccessComplete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
