import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import App from "./App.tsx"
import "./index.css"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AccessProvider } from "@/contexts/access-context"
import { BrandProvider } from "@/contexts/brand-context"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="light">
        <BrandProvider>
          <AccessProvider>
            <TooltipProvider>
              <App />
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </AccessProvider>
        </BrandProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
)
