import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import PesaBotWidget from "@/components/pesa-bot-widget"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "PochiYangu - Kenyan Fintech Platform",
  description:
    "A fintech platform for Kenyan users, emphasizing chamas—group savings and investment circles—with additional tools for personal finance management.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <PesaBotWidget />
            <Toaster />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
