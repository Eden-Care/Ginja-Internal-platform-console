import * as React from "react"

export type BrandSettings = {
  brandName: string
  tagline: string
  logoUrl?: string
  colors: {
    primary: string
    secondary: string
    accent: string
  }
}

type BrandContextValue = {
  brand: BrandSettings
  setBrand: React.Dispatch<React.SetStateAction<BrandSettings>>
}

// Colors are HSL channels (e.g. "240 61% 60%") to match the token contract in
// index.css, where everything resolves through hsl(var(--token)). Injecting any
// other format here would produce hsl(oklch(...)) and break the theme at mount.
const DEFAULT_BRAND: BrandSettings = {
  brandName: "Ginja AI",
  tagline: "Platform Console",
  logoUrl: "/ginja_icon.svg",
  colors: {
    primary: "240 61% 60%",
    secondary: "224 24% 96%",
    accent: "240 88% 96%",
  },
}

const BrandContext = React.createContext<BrandContextValue | undefined>(
  undefined
)

function applyBrandEffects(brand: BrandSettings) {
  const root = document.documentElement

  root.style.setProperty("--primary", brand.colors.primary)
  root.style.setProperty("--sidebar-primary", brand.colors.primary)
  root.style.setProperty("--sidebar-ring", brand.colors.primary)
  root.style.setProperty("--sidebar-active-bg", brand.colors.primary)
  root.style.setProperty("--ring", brand.colors.primary)
  root.style.setProperty("--secondary", brand.colors.secondary)
  root.style.setProperty("--accent", brand.colors.accent)
  document.title = brand.brandName
}

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrand] = React.useState<BrandSettings>(DEFAULT_BRAND)

  React.useEffect(() => {
    applyBrandEffects(brand)
  }, [brand])

  const value = React.useMemo(() => ({ brand, setBrand }), [brand])

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
}

export function useBrand(): BrandContextValue {
  const ctx = React.useContext(BrandContext)
  if (!ctx) throw new Error("useBrand must be used within BrandProvider")
  return ctx
}
