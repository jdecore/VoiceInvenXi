import { Component, type ReactNode } from 'react'
import { IconAlertTriangle } from '@tabler/icons-react'
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
        <div className="error-screen">
          <div className="error-icon">
            <IconAlertTriangle />
          </div>
          <h2 className="error-title">Algo salió mal</h2>
          <p className="error-msg">{message}</p>
          <p className="error-detail">
            {typeof window !== 'undefined' ? window.location.pathname : ''}
          </p>
          <div className="error-retry">
            <Button variant="filled" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
