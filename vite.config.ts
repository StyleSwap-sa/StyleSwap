import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";


// Only use Manus runtime plugin in development/preview mode
const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  ...(process.env.NODE_ENV === 'production' ? [] : [vitePluginManusRuntime()]),
];

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  plugins: plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  // Ensure script tags are properly included in production
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    // Ensure HTML includes script tags
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Performance optimizations
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        passes: 2,
      },
      mangle: true,
    },
    chunkSizeWarningLimit: 1000,
    // Simple, effective code splitting
    rollupOptions: {
      input: path.resolve(import.meta.dirname, "client", "index.html"),
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'wouter'],
          'trpc': ['@tanstack/react-query', '@trpc/client', '@trpc/react-query'],
          'ui': ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
