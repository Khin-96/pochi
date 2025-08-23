import type React from "react"
import { Inter } from "next/font/google"
import { Providers } from "./providers"
import Navbar from "@/components/navbar"
import PesaBotWidget from "@/components/pesa-bot-widget"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "PochiYangu - Kenyan Fintech Platform",
  description:
    "A fintech platform for Kenyan users, emphasizing chamas—group savings and investment circles—with additional tools for personal finance management.",
  generator: 'khin'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <PesaBotWidget />
          </div>
        </Providers>
      </body>
    </html>
  )
}