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
    // ENHANCED ERROR LOGGING
    console.group('🚨 ERROR BOUNDARY TRIGGERED');
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.groupEnd();

    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Environment-based error details - NEVER show in production
      const showDetails = import.meta.env.DEV || import.meta.env.MODE === 'development';

      if (showDetails) {
        return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-red-900/50 border-2 border-red-700 rounded-lg p-6 max-w-4xl w-full">
              <h1 className="text-2xl font-bold text-red-400 mb-4">
                🚨 ERROR BOUNDARY TRIGGERED (DEV MODE)
              </h1>

              <div className="mb-4 p-3 bg-red-950 rounded border border-red-800">
                <h2 className="text-lg font-semibold text-red-300 mb-2">Error Message:</h2>
                <pre className="text-sm text-red-200 whitespace-pre-wrap">
                  {this.state.error?.message || 'No message'}
                </pre>
              </div>

              <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-700">
                <h2 className="text-lg font-semibold text-gray-300 mb-2">Error Stack:</h2>
                <pre className="text-xs text-gray-400 overflow-auto max-h-48">
                  {this.state.error?.stack || 'No stack'}
                </pre>
              </div>

              <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-700">
                <h2 className="text-lg font-semibold text-gray-300 mb-2">Component Stack:</h2>
                <pre className="text-xs text-gray-400 overflow-auto max-h-48">
                  {this.state.errorInfo?.componentStack || 'No component stack'}
                </pre>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
                >
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        );
      }

      // PRODUCTION MODE: User-friendly error
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 max-w-lg w-full">
            <h1 className="text-xl font-bold text-red-400 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-300 mb-4">
              The page could not be loaded. Try refreshing or go back to home.
            </p>
            {this.state.error && (
              <details className="mb-4">
                <summary className="text-red-400 cursor-pointer">Technical details</summary>
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
                Go Home
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
