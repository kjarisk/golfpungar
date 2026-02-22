import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  /** Optional fallback to render instead of the default error UI */
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * React error boundary that catches render errors in child components
 * and displays a recovery UI instead of crashing the entire app.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="size-6 text-red-500" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground max-w-sm text-sm">
              An unexpected error occurred. Try refreshing the page or going
              back.
            </p>
          </div>
          {this.state.error && (
            <pre className="bg-muted max-w-full overflow-x-auto rounded-md px-3 py-2 text-left text-xs">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={this.handleReset}>
              Try Again
            </Button>
            <Button onClick={() => (window.location.href = '/feed')}>
              Go Home
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
