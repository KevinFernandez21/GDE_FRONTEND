import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "../providers/query-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Importadora El Mayorista - Sistema de Inventario",
  description: "Sistema integral de gestión de inventario",
  generator: 'v0.dev',
  icons: {
    icon: '/logo-iem.png',
    shortcut: '/logo-iem.png',
    apple: '/logo-iem.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
