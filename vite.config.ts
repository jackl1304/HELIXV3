import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
// Entfernt plattformspezifisches Runtime Error Overlay

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Windows-kompatible asynchrone Konfiguration
export default defineConfig(async () => {
  const plugins: any[] = [
    react(),
  ];

  // Plattform-spezifische Plugins vollständig entfernt (Migration zu neutraler Umgebung)

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
        "lucide-react": path.resolve(__dirname, "client", "src", "components", "icons", "index.tsx"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
      base: "./",
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
