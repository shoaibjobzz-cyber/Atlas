import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }
          if (id.includes("@xyflow/react")) {
            return "xyflow";
          }
          if (id.includes("@mui/") || id.includes("@emotion/")) {
            return "mui";
          }
          if (id.includes("react-router-dom")) {
            return "router";
          }
          return undefined;
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
