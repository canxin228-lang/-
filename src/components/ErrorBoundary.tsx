import * as React from 'react';
import { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if ((this as any).state.hasError) {
      let errorMessage = "Something went wrong.";
      
      try {
        // Check if it's a Firestore error JSON
        const firestoreError = JSON.parse((this as any).state.error?.message || "");
        if (firestoreError.error && firestoreError.operationType) {
          errorMessage = `Firestore Error (${firestoreError.operationType}): ${firestoreError.error}`;
        }
      } catch (e) {
        // Not a JSON error, use default or error message
        errorMessage = (this as any).state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-6">
          <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-xl max-w-md w-full border border-error/10">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-6 mx-auto">
              <span className="material-symbols-outlined text-error text-3xl">error</span>
            </div>
            <h2 className="text-2xl font-bold text-on-surface text-center mb-4">Application Error</h2>
            <p className="text-on-surface-variant text-center mb-8">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
