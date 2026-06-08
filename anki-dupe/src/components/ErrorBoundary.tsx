import React, { Component, ErrorInfo, ReactNode } from 'react'
import Button from './ui/Button'
import Card from './ui/Card'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    // We can log this to our upcoming log system later
  }

  private handleReset = () => {
    window.location.hash = '#/dashboard'
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-surface-light p-6">
          <Card className="max-w-md w-full text-center py-10">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-500 mb-6 px-4">
              An unexpected error occurred. You can try reloading the app or returning to the dashboard.
            </p>
            {this.state.error && (
               <div className="bg-red-50 text-red-500 text-[10px] p-2 rounded mb-6 text-left font-mono overflow-auto max-h-32">
                 {this.state.error.toString()}
               </div>
            )}
            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReset} variant="primary">
                Reload App
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    return this.children
  }
}
