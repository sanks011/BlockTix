import type React from "react"
import "@/app/globals.css"
import "@/app/text-fix.css"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/hooks/use-auth"
import { Web3Provider } from "@/lib/hooks/use-web3"
import { Toaster } from "@/components/ui/toaster"
import { BackgroundVideo } from "@/components/background-video"

export const metadata: Metadata = {
  title: "BlockTix - Web3 Event Platform",
  description: "Next-gen event platform with blockchain ticketing and NFT integration",
  generator: 'Sankalpa Sarkar'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap');
        </style>
      </head>
      <body className="work-sans-regular min-h-screen bg-black antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Web3Provider>
            <AuthProvider>
              <BackgroundVideo />
              <div className="text-gray-100">
                {children}
              </div>
              <Toaster />
            </AuthProvider>
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}
