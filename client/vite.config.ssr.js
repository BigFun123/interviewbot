import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: ".", // Current directory (client)
  plugins: [react()],
  build: {
    outDir: "../dist/server", // Relative path to parent/dist/server
    emptyOutDir: false,
    ssr: true, // This is crucial for SSR builds
    rollupOptions: {
      input: "./entry-server.jsx", // SSR entry point
      output: {
        entryFileNames: "[name].js",
        format: "es",
      },
    },
    // Handle CSS in SSR build
    cssCodeSplit: false,
  },
});