import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/hooks/use-auth"
import { Web3Provider } from "@/lib/hooks/use-web3"
import { Toaster } from "@/components/ui/toaster"
import { BackgroundVideo } from "@/components/background-video"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BlockTix - Web3 Event Platform",
  description: "Next-gen event platform with blockchain ticketing and NFT integration",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-black text-white antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Web3Provider>
            <AuthProvider>
              <BackgroundVideo />
              {children}
              <Toaster />
            </AuthProvider>
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}
