import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-[#0a0a0f] p-6 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FF5A5F]/20 border border-[#FF5A5F]/30 mb-4">
            <AlertTriangle className="w-8 h-8 text-[#FF5A5F]" />
          </div>
          <h2 className="text-white text-lg font-semibold mb-2">
            Algo salió mal
          </h2>
          <p className="text-white/60 text-sm mb-6 max-w-[280px]">
            {this.state.error?.message || 'Error inesperado'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="
              px-6 py-2.5 rounded-full
              bg-[#4F8CFF] hover:bg-[#3A6FD8]
              text-white text-sm font-semibold
              transition-colors duration-200
            "
          >
            Reintentar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
