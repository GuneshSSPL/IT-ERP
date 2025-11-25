import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
// Initialize database on server startup
import "@/lib/db/startup"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "IT ERP System",
  description: "Enterprise Resource Planning for IT Software Development Companies",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

