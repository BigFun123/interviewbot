import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig((config) => {
  console.log("Vite config:", config);
  
  const { command, ssrBuild, mode } = config;
  
  // Use relative paths that work on both Windows and Linux
  const isSSRBuild = ssrBuild || mode === 'ssr' || command.includes('ssr');
  
  console.log("Detected SSR build:", isSSRBuild);
  
  if (isSSRBuild) {
    console.log("Configuring for SSR build");
    return {
      root: ".", // Current directory (client)
      plugins: [react()],
      build: {
        outDir: "../dist/server", // Relative path
        emptyOutDir: false,
        ssr: true,
        rollupOptions: {
          input: "./entry-server.jsx", // Relative path
          output: {
            entryFileNames: "[name].js",
            format: "es",
          },
        },
      },
    };
  } else {
    console.log("Configuring for client build");
    return {
      root: ".", // Current directory (client)
      plugins: [react()],
      build: {
        outDir: "../dist/client", // Relative path
        emptyOutDir: false,
        manifest: true,
        rollupOptions: {
          input: "./index.html", // Relative path
        },
        // Ensure CSS is properly extracted and not code-split
        cssCodeSplit: false,
      },
    };
  }
});
