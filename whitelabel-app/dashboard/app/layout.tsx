import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'White-Label App Configurator',
  description: 'Configure and generate white-label mobile apps',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
