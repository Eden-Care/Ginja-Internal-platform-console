import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"

import App from "./App.tsx"
import "./index.css"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AccessProvider } from "@/contexts/access-context"
import { AuthProvider } from "@/contexts/auth-context"
import { BrandProvider } from "@/contexts/brand-context"
import { queryClient } from "@/lib/api/query-client"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light">
          <BrandProvider>
            <AuthProvider>
              <AccessProvider>
                <TooltipProvider>
                  <App />
                  <Toaster richColors position="top-right" />
                </TooltipProvider>
              </AccessProvider>
            </AuthProvider>
          </BrandProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)
