import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "../Release",
    emptyOutDir: true,
    sourcemap: false
  }
});
