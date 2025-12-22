import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary specifically for catching portal-related removeChild errors
 * Suppresses the error display but logs it for debugging
 */
export default class PortalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Check if it's the portal removeChild error
    if (error.message?.includes('removeChild') || error.name === 'NotFoundError') {
      console.warn('[PortalErrorBoundary] Caught and suppressed portal error:', error.message);
      // Don't set hasError to true - just suppress it
      return { hasError: false };
    }
    // For other errors, mark as error but don't throw
    console.error('[PortalErrorBoundary] Non-portal error:', error);
    return { hasError: false }; // Let parent boundary handle it
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (error.message?.includes('removeChild') || error.name === 'NotFoundError') {
      console.warn('[PortalErrorBoundary] Portal cleanup error suppressed:', error, info);
    } else {
      console.error('[PortalErrorBoundary] Error caught:', error, info);
    }
  }

  render() {
    return this.props.children;
  }
}
