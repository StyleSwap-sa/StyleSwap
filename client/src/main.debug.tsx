import { createRoot } from "react-dom/client";
import React from "react";

// Ultra-simple debug app to test React rendering
function DebugApp() {
  const [logs, setLogs] = React.useState<string[]>(['App mounted']);

  React.useEffect(() => {
    setLogs(prev => [...prev, 'useEffect running']);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 Debug App - React Rendering Test</h1>
      <p>If you see this, React is working!</p>
      <h2>Logs:</h2>
      <div style={{ 
        background: '#f0f0f0', 
        padding: '10px', 
        borderRadius: '5px',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
      
      <h2>Environment:</h2>
      <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
        <p>NODE_ENV: {process.env.NODE_ENV}</p>
        <p>VITE_APP_ID: {process.env.VITE_APP_ID ? '***' : 'undefined'}</p>
        <p>VITE_OAUTH_PORTAL_URL: {process.env.VITE_OAUTH_PORTAL_URL || 'undefined'}</p>
      </div>

      <h2>Testing imports...</h2>
      <TestImports setLogs={setLogs} />
    </div>
  );
}

function TestImports({ setLogs }: { setLogs: (fn: (prev: string[]) => string[]) => void }) {
  React.useEffect(() => {
    const test = async () => {
      try {
        setLogs(prev => [...prev, 'Testing App import...']);
        const App = await import('./App');
        setLogs(prev => [...prev, '✓ App imported successfully']);
      } catch (err) {
        setLogs(prev => [...prev, `✗ App import failed: ${err}`]);
      }

      try {
        setLogs(prev => [...prev, 'Testing trpc import...']);
        const { trpc } = await import('./lib/trpc');
        setLogs(prev => [...prev, '✓ trpc imported successfully']);
      } catch (err) {
        setLogs(prev => [...prev, `✗ trpc import failed: ${err}`]);
      }

      try {
        setLogs(prev => [...prev, 'Testing useAuth import...']);
        const { useAuth } = await import('./_core/hooks/useAuth');
        setLogs(prev => [...prev, '✓ useAuth imported successfully']);
      } catch (err) {
        setLogs(prev => [...prev, `✗ useAuth import failed: ${err}`]);
      }
    };
    test();
  }, [setLogs]);

  return null;
}

console.log('[Debug Main] Starting...');
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error('[Debug Main] Root element not found!');
  document.body.innerHTML = '<h1>ERROR: Root element not found</h1>';
} else {
  console.log('[Debug Main] Root element found, rendering...');
  const root = createRoot(rootElement);
  root.render(<DebugApp />);
  console.log('[Debug Main] Render complete');
}
