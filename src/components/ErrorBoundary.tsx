import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'
import styles from './ErrorBoundary.module.css'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  message: string
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'Ocurrió un error inesperado' }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info)
  }

  handleRetry = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className={styles.fallback}>
          <div className={styles.card}>
            <span className={styles.icon}>
              <AlertTriangle size={40} />
            </span>
            <h2 className={styles.title}>Algo salió mal</h2>
            <p className={styles.message}>{this.state.message}</p>
            <button className={styles.retry} onClick={this.handleRetry}>
              <RotateCw size={18} />
              Reintentar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
