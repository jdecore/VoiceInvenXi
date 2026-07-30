import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Check, Tag, Building2, LayoutGrid, Box, Scale } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import GlassButton from '@/components/GlassButton'
import GlassInput from '@/components/GlassInput'
import ProductImage from '@/components/ProductImage'
import Barcode from '@/components/Barcode'
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

const FIELD_ICONS: Record<keyof FormData, React.ReactNode> = {
  name: <Tag size={18} />,
  brand: <Building2 size={18} />,
  category: <LayoutGrid size={18} />,
  presentation: <Box size={18} />,
  unit: <Scale size={18} />,
}

const FIELD_LABELS: Record<keyof FormData, string> = {
  name: 'Nombre',
  brand: 'Marca',
  category: 'Categoría',
  presentation: 'Presentación',
  unit: 'Unidad',
}

const FIELD_PLACEHOLDERS: Record<keyof FormData, string> = {
  name: 'Ej: Aceite de Oliva',
  brand: 'Ej: La Española',
  category: 'Ej: Abarrotes',
  presentation: 'Ej: Botella 500ml',
  unit: 'Ej: Unidad',
}

export default function NewProductPage() {
  const { barcode } = useParams<{ barcode: string }>()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [activeField, setActiveField] = useState<keyof FormData | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [validationError, setValidationError] = useState('')

  const { isListening, transcript, interimTranscript, start, stop, isSupported, reset } =
    useSTT()
  const { speak: speakText } = useTTS()

  const updateField = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setValidationError('')
  }, [])

  const handleMicPress = useCallback(
    (field: keyof FormData) => {
      if (isListening && activeField === field) {
        stop()
      } else {
        setActiveField(field)
        reset()
        start()
      }
    },
    [isListening, activeField, start, stop, reset]
  )

  useEffect(() => {
    if (!isListening && transcript && activeField) {
      updateField(activeField, transcript)
      setActiveField(null)
      reset()
    }
  }, [isListening, transcript, activeField, updateField, reset])

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
  }, [form, barcode])

  const handleSuccessComplete = useCallback(() => {
    navigate('/')
  }, [navigate])

  const fieldKeys: (keyof FormData)[] = ['name', 'brand', 'category', 'presentation', 'unit']

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.topBar}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button className={styles.backButton} onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>
        <span className={styles.logo}>VoiceInvenXi</span>
      </motion.div>

      <div className={styles.content}>
        <motion.div
          className={styles.headerSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <ProductImage alt="Producto escaneado" size="md" />
          <span className={styles.scannedLabel}>Código escaneado</span>
          <Barcode value={barcode || '---'} />
        </motion.div>

        <div className={styles.formSection}>
          {fieldKeys.map((field, index) => (
            <motion.div
              key={field}
              className={styles.fieldRow}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.08 }}
            >
              <div className={styles.fieldInput}>
                <GlassInput
                  label={FIELD_LABELS[field]}
                  value={form[field]}
                  onChange={(v) => updateField(field, v)}
                  placeholder={FIELD_PLACEHOLDERS[field]}
                  icon={FIELD_ICONS[field]}
                />
              </div>
              {isSupported && (
                <MicButton
                  isListening={isListening && activeField === field}
                  onClick={() => handleMicPress(field)}
                  size={20}
                />
              )}
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {isListening && activeField && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <GlassCard compact>
                <div style={{ textAlign: 'center' }}>
                  <VoiceWave active />
                  <div style={{
                    marginTop: 'var(--space-sm)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)',
                  }}>
                    {interimTranscript || 'Escuchando...'}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {isSaving && <LoadingDots text="Guardando producto..." />}

        <motion.div
          className={styles.footerSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {validationError && (
            <span className={styles.validationError}>{validationError}</span>
          )}
          <GlassButton
            variant="primary"
            size="lg"
            fullWidth
            icon={<Check size={22} />}
            onClick={handleSave}
            disabled={showSuccess || isSaving}
          >
            Guardar
          </GlassButton>
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
