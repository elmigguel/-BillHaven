import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 max-w-lg w-full">
            <h1 className="text-xl font-bold text-red-400 mb-4">
              Er is iets misgegaan
            </h1>
            <p className="text-gray-300 mb-4">
              De pagina kon niet geladen worden. Probeer te refreshen of ga terug naar home.
            </p>
            {this.state.error && (
              <details className="mb-4">
                <summary className="text-red-400 cursor-pointer">Technische details</summary>
                <pre className="mt-2 p-2 bg-gray-800 rounded text-xs text-gray-400 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Refresh
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
              >
                Naar Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
