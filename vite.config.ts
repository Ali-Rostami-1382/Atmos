import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "production" ? "/Atmos/" : "/",
  test: {
    environment: "jsdom",
    setupFiles: "./src/test-setup.ts",
  },
}));
