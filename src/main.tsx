import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import ErrorBoundary from '@/components/ErrorBoundary'

// Global handlers to avoid a white-screen when uncaught errors occur outside React render lifecycle
function mountGlobalErrorHandlers() {
	if (typeof window === 'undefined') return;

		window.addEventListener('error', (ev) => {
			try {
				console.error('[Global] Uncaught error', ev.error || ev.message, ev);
				// show minimal overlay so user sees something instead of white screen
				const root = document.getElementById('root');
				if (root) {
					root.innerHTML = `
	<div style="padding:24px;font-family:Inter,system-ui,Arial;">
		<h2 style="color:#b91c1c;">Unhandled Error</h2>
		<pre style="white-space:pre-wrap;background:#111;color:#fff;padding:12px;border-radius:6px;max-height:60vh;overflow:auto;">${String(
						ev.error || ev.message
					)}</pre>
		<button onclick="location.reload()" style="margin-top:12px;padding:8px 12px;border-radius:6px;border:none;background:#111;color:#fff">Reload</button>
	</div>
	`;
				}
			} catch (err) {
				console.warn('[Global] Failed to render error overlay', err);
			}
		});

		window.addEventListener('unhandledrejection', (ev) => {
			try {
				console.error('[Global] Unhandled Rejection', ev.reason);
				const root = document.getElementById('root');
				if (root) {
					root.innerHTML = `
	<div style="padding:24px;font-family:Inter,system-ui,Arial;">
		<h2 style="color:#b91c1c;">Unhandled Promise Rejection</h2>
		<pre style="white-space:pre-wrap;background:#111;color:#fff;padding:12px;border-radius:6px;max-height:60vh;overflow:auto;">${String(
						ev.reason
					)}</pre>
		<button onclick="location.reload()" style="margin-top:12px;padding:8px 12px;border-radius:6px;border:none;background:#111;color:#fff">Reload</button>
	</div>
	`;
				}
			} catch (err) {
				console.warn('[Global] Failed to render rejection overlay', err);
			}
		});
}

mountGlobalErrorHandlers();

createRoot(document.getElementById("root")!).render(
	<ErrorBoundary>
		<App />
	</ErrorBoundary>
);
