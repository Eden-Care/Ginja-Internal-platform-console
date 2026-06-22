import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// The deployed API host. In dev the app calls a relative "/internal-platform"
// path which this proxy forwards here, so the browser stays same-origin and
// never hits CORS.
const API_TARGET = "https://dev-api.ginja.ai"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/internal-platform": {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-data": ["@tanstack/react-query", "axios"],
          "vendor-radix": ["radix-ui"],
          "vendor-ui": [
            "lucide-react",
            "class-variance-authority",
            "clsx",
            "tailwind-merge",
            "cmdk",
            "sonner",
            "next-themes",
          ],
          "vendor-dates": ["date-fns", "react-day-picker"],
        },
      },
    },
  },
})
