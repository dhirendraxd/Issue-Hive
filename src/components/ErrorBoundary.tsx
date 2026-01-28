import React from 'react';
import { Home, RefreshCw, Bug, Coffee } from 'lucide-react';

type State = { hasError: boolean; error?: Error | null; info?: React.ErrorInfo | null };

type Props = { children?: React.ReactNode };

const ERROR_MESSAGES = [
  "Well, this is embarrassing...",
  "Houston, we have a problem.",
  "Yikes. That wasn't supposed to happen.",
  "Our code just rage-quit.",
  "Error 418: I'm a teapot. (Just kidding, it's worse.)",
  "The developers are crying right now.",
  "This is why we can't have nice things.",
  "Task failed successfully. Wait, no...",
  "Congratulations! You broke the internet. (Just our part.)",
  "The hamsters running our servers took a coffee break.",
];

const SUBTEXT = [
  "Don't worry, it's not you. It's definitely us.",
  "Our bad. Like, really bad.",
  "We promise we tested this. Apparently not enough.",
  "This is going straight to the bug tracker.",
  "The irony of an issue tracker having issues is not lost on us.",
  "Plot twist: The error is the feature.",
  "This error message cost us 3 hours to design. Enjoy.",
  "Stack overflow? More like stack... underflow? We'll see ourselves out.",
];

export default class ErrorBoundary extends React.Component<Props, State> {
  private errorMessage: string;
  private subtext: string;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
    this.errorMessage = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];
    this.subtext = SUBTEXT[Math.floor(Math.random() * SUBTEXT.length)];
  }

  static getDerivedStateFromError(error: Error) {
    // Suppress portal removeChild errors - these are harmless cleanup issues
    if (error.message?.includes('removeChild') || error.name === 'NotFoundError') {
      console.warn('[ErrorBoundary] Suppressed portal cleanup error:', error.message);
      return { hasError: false, error: null, info: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Suppress portal removeChild errors
    if (error.message?.includes('removeChild') || error.name === 'NotFoundError') {
      console.warn('[ErrorBoundary] Portal cleanup error suppressed:', error.message);
      return;
    }
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
        background: 'linear-gradient(135deg, #FFF5E6 0%, #FFE4C4 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{ 
          maxWidth: 700, 
          background: 'white', 
          borderRadius: 16, 
          padding: 48, 
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}>
          {/* Sad Bee Emoji */}
          <div style={{ fontSize: 72, marginBottom: 16 }}>🐝💥</div>
          
          <h1 style={{ 
            fontSize: 32, 
            fontWeight: 700, 
            marginBottom: 8, 
            color: '#1a1a1a',
            lineHeight: 1.2,
          }}>
            {this.errorMessage}
          </h1>
          
          <p style={{ 
            fontSize: 16, 
            color: '#666', 
            marginBottom: 8,
            fontWeight: 500,
          }}>
            {this.subtext}
          </p>

          <p style={{ 
            fontSize: 14, 
            color: '#999', 
            marginBottom: 24,
            fontStyle: 'italic',
          }}>
            Technical jargon: <span style={{ fontFamily: 'monospace', color: '#f97316' }}>{error?.message || 'Something exploded'}</span>
          </p>

          {/* Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            marginBottom: 24,
          }}>
            <button 
              onClick={() => location.reload()} 
              style={{ 
                padding: '12px 24px', 
                borderRadius: 9999, 
                border: 'none', 
                background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)', 
                color: 'white',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                transition: 'transform 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <RefreshCw size={16} /> Try Again (Maybe It'll Work)
            </button>
            
            <button 
              onClick={() => location.href = '/'} 
              style={{ 
                padding: '12px 24px', 
                borderRadius: 9999, 
                border: '2px solid #e5e7eb', 
                background: 'white', 
                color: '#1a1a1a',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              <Home size={16} /> Retreat to Safety
            </button>
          </div>

          {/* Expandable Error Details */}
          <details style={{ 
            marginTop: 24, 
            textAlign: 'left',
            background: '#fafafa',
            padding: 16,
            borderRadius: 8,
            border: '1px solid #e5e7eb',
          }}>
            <summary style={{ 
              cursor: 'pointer', 
              fontWeight: 600, 
              fontSize: 13,
              color: '#666',
              userSelect: 'none',
            }}>
              🤓 Show me the gory details
            </summary>
            {info?.componentStack && (
              <pre style={{ 
                background: '#1a1a1a', 
                color: '#22c55e', 
                padding: 16, 
                borderRadius: 6, 
                overflowX: 'auto',
                fontSize: 11,
                marginTop: 12,
                fontFamily: 'Consolas, Monaco, monospace',
                lineHeight: 1.6,
              }}>
                {info.componentStack}
              </pre>
            )}
          </details>

          {/* Footer Message */}
          <div style={{ 
            marginTop: 32, 
            paddingTop: 24, 
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: '#999',
            fontSize: 12,
          }}>
            <Coffee size={14} />
            <span>
              If this keeps happening, maybe report it to us? 
              <a 
                href="/raise-issue" 
                style={{ color: '#f97316', textDecoration: 'none', marginLeft: 4, fontWeight: 600 }}
              >
                We promise we'll read it.
              </a>
            </span>
          </div>
        </div>
      </div>
    );
  }
}
