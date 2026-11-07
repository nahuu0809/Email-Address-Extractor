import EmailExtractorUnified from "@/components/email-extractor-unified"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"

export default function Home() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="email-validator-theme">
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300 py-8">
        <div className="container mx-auto">
          <EmailExtractorUnified />
          <Toaster />
        </div>
      </div>
    </ThemeProvider>
  )
}
