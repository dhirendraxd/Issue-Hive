import React from 'react';

type State = { hasError: boolean; error?: Error | null; info?: React.ErrorInfo | null };

type Props = { children?: React.ReactNode };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // You can send errors to a logging endpoint here
    console.error('[ErrorBoundary] Caught error:', error, info);
    this.setState({ error, info });
  }

  render() {
    if (!this.state.hasError) return this.props.children as React.ReactElement;

    const { error, info } = this.state;

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        boxSizing: 'border-box',
        background: 'linear-gradient(180deg,#fff 0%,#f7f7f7 100%)',
        color: '#222',
      }}>
        <div style={{ maxWidth: 900 }}>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ marginBottom: 12, color: '#444' }}>{error?.message}</p>
          {info?.componentStack && (
            <pre style={{ background: '#111', color: '#eee', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
              {info.componentStack}
            </pre>
          )}
          <div style={{ marginTop: 12 }}>
            <button onClick={() => location.reload()} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#111', color: '#fff' }}>Reload</button>
          </div>
        </div>
      </div>
    );
  }
}
