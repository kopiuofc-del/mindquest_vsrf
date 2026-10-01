import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  // Caminhos relativos: permite hospedar em subpastas (ex.: GitHub Pages).
  base: "./",
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    // Garante que a pasta seja limpa antes de cada build, evitando que o
    // Tailwind escaneie o HTML gerado anteriormente.
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
