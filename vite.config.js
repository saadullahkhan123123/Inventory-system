import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://inventory-system-back-end.onrender.com/",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: ['es2015', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  define: {
    'process.env': {},
  },
});
