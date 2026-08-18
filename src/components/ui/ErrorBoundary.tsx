import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: unknown
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      const error = this.state.error
      const message = error?.message || String(error) || 'Error inesperado'
      return (
        <div className="flex flex-col items-center justify-center h-full bg-surface px-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-error-container mb-4">
            <AlertTriangle className="w-8 h-8 text-error" />
          </div>
          <h2 className="text-on-surface text-lg font-semibold">Algo salió mal</h2>
          <p className="text-on-surface-muted text-sm mt-1 text-center max-w-[280px]">
            {message}
          </p>
          <p className="text-on-surface-muted text-xs mt-3 text-center max-w-[280px] break-all">
            {typeof window !== 'undefined' ? window.location.pathname : ''}
          </p>
          <Button
            variant="filled"
            className="mt-6"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
