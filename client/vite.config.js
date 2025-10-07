import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ command, ssrBuild }) => {
  const rootDir = path.resolve(__dirname);
  const outDir = ssrBuild
    ? path.resolve(__dirname, "../dist/server")
    : path.resolve(__dirname, "../dist/client");

  return {
    root: rootDir,
    plugins: [react()],
    build: {
      outDir,
      emptyOutDir: false, // don't delete the other build folder
      manifest: !ssrBuild, // only generate manifest for client
      rollupOptions: {
        input: ssrBuild
          ? path.resolve(__dirname, "src/entry-server.jsx")
          : path.resolve(__dirname, "index.html"),
        output: {
          entryFileNames: ssrBuild ? "[name].js" : "assets/[name]-[hash].js",
        },
      },
    },
    server: {
      port: 5173,
      open: true,
    },
  };
});
