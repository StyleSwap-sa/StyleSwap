import { createRoot } from "react-dom/client";
import App from "./App.minimal";

console.log('[Minimal] Starting...');

const rootElement = document.getElementById("root");
console.log('[Minimal] Root element:', rootElement);

if (!rootElement) {
  throw new Error('Root element not found!');
}

const root = createRoot(rootElement);
console.log('[Minimal] Rendering...');

root.render(<App />);

console.log('[Minimal] Done!');
