import React, { Component, ErrorInfo, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Button from './ui/Button'
import Card from './ui/Card'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class PageErrorBoundaryInner extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Page error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[50vh] p-6">
          <Card className="max-w-md w-full text-center py-10">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-bold text-slate-100 mb-2">This page failed to load</h2>
            <p className="text-sm text-slate-400 mb-4">
              Try another page from the sidebar, or reload the app.
            </p>
            {this.state.error && (
              <div className="bg-red-50 text-red-500 text-[10px] p-2 rounded mb-4 text-left font-mono overflow-auto max-h-24">
                {this.state.error.toString()}
              </div>
            )}
            <Button onClick={() => window.location.reload()} variant="primary">
              Reload App
            </Button>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/** Resets automatically when the route changes so one bad page doesn't block navigation. */
export default function PageErrorBoundary({ children }: Props) {
  const location = useLocation()
  return (
    <PageErrorBoundaryInner key={location.pathname}>
      {children}
    </PageErrorBoundaryInner>
  )
}
