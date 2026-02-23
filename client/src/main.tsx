import { createRoot } from "react-dom/client";
import React from "react";

console.log('[Test] Starting minimal React test...');

const TestApp = () => {
  console.log('[Test] TestApp component rendering');
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center', background: '#e8f4f8' }}>
      <h1 style={{ color: '#0066cc' }}>✅ React is Working!</h1>
      <p style={{ color: '#333', fontSize: '18px' }}>If you see this message, React rendering is functional.</p>
      <p style={{ color: '#666', fontSize: '14px' }}>The issue is with the complex setup, not React itself.</p>
    </div>
  );
};

try {
  console.log('[Test] Getting root element...');
  const rootElement = document.getElementById("root");
  console.log('[Test] Root element found:', !!rootElement);
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  console.log('[Test] Creating React root...');
  const root = createRoot(rootElement);
  
  console.log('[Test] Rendering TestApp...');
  root.render(<TestApp />);
  
  console.log('[Test] React app rendered successfully');
} catch (error) {
  console.error('[Test] Error:', error);
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `<div style="padding: 40px; font-family: monospace; background: #ffcccc; color: #cc0000;"><h1>ERROR</h1><p>${error instanceof Error ? error.message : String(error)}</p></div>`;
  }
}
