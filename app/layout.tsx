import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MTSDF Text Rendering Demo',
  description: 'Scalable GPU text rendering with MTSDF and HarfBuzz',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
