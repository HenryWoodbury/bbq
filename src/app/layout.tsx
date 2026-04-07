import { ClerkProvider } from "@clerk/nextjs"
import type { Metadata } from "next"
import { Geist_Mono, Lato } from "next/font/google"
import { Header } from "@/components/header"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import "./globals.css"

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "block",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "block",
})

export const metadata: Metadata = {
  title: "Baseball Queue — Fantasy Baseball Drafts",
  description: "Fantasy baseball draft and league management",
  icons: { icon: "/icon.svg" },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            lato.variable,
            geistMono.variable,
            "min-h-screen w-full overflow-x-hidden bg-background antialiased",
          )}
        >
          <ThemeProvider>
            <Header />
            <main className="w-full px-4 py-8 sm:px-6 lg:px-8">{children}</main>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
