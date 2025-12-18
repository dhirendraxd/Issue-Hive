import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import ErrorBoundary from '@/components/ErrorBoundary'
import { validateEnv } from '@/lib/env'

// Validate environment variables on startup
validateEnv();

// Store React root instance globally so we can unmount it if needed
let reactRoot: ReturnType<typeof createRoot> | null = null;

// Global handlers to avoid a white-screen when uncaught errors occur outside React render lifecycle
function mountGlobalErrorHandlers() {
	if (typeof window === 'undefined') return;

	window.addEventListener('error', (ev) => {
		try {
			console.error('[Global] Uncaught error', ev.error || ev.message, ev);
			
			// Prevent default error handling to avoid conflicts
			ev.preventDefault();
			
			// Unmount React before manipulating DOM directly
			if (reactRoot) {
				try {
					reactRoot.unmount();
					reactRoot = null;
				} catch (unmountErr) {
					console.warn('[Global] Failed to unmount React root', unmountErr);
				}
			}
			
			// show minimal overlay so user sees something instead of white screen
			const root = document.getElementById('root');
			if (root) {
				// Use textContent = '' instead of removeChild to avoid DOM errors
				root.textContent = '';
				
				// Sanitize error message to prevent XSS
				const errorMsg = String(ev.error || ev.message).replace(/</g, '&lt;').replace(/>/g, '&gt;');
				root.innerHTML = `
<div style="padding:24px;font-family:Inter,system-ui,Arial;">
	<h2 style="color:#b91c1c;">Unhandled Error</h2>
	<pre style="white-space:pre-wrap;background:#111;color:#fff;padding:12px;border-radius:6px;max-height:60vh;overflow:auto;">${errorMsg}</pre>
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
			
			// Prevent default handling
			ev.preventDefault();
			
			// Unmount React before manipulating DOM directly
			if (reactRoot) {
				try {
					reactRoot.unmount();
					reactRoot = null;
				} catch (unmountErr) {
					console.warn('[Global] Failed to unmount React root', unmountErr);
				}
			}
			
			const root = document.getElementById('root');
			if (root) {
				// Use textContent = '' instead of removeChild to avoid DOM errors
				root.textContent = '';
				
				// Sanitize error message to prevent XSS
				const errorMsg = String(ev.reason).replace(/</g, '&lt;').replace(/>/g, '&gt;');
				root.innerHTML = `
<div style="padding:24px;font-family:Inter,system-ui,Arial;">
	<h2 style="color:#b91c1c;">Unhandled Promise Rejection</h2>
	<pre style="white-space:pre-wrap;background:#111;color:#fff;padding:12px;border-radius:6px;max-height:60vh;overflow:auto;">${errorMsg}</pre>
	<button onclick="location.reload()" style="margin-top:12px;padding:8px 12px;border-radius:6px;border:none;background:#111;color:#fff">Reload</button>
</div>
`;
			}
		} catch (err) {
			console.warn('[Global] Failed to render rejection overlay', err);
		}
	});
}

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error('Root element not found');
}

reactRoot = createRoot(rootElement);

// Mount error handlers after React root is created
mountGlobalErrorHandlers();

reactRoot.render(
	<ErrorBoundary>
		<App />
	</ErrorBoundary>
);
