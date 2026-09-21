import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ecdise SaaS — Control Plane',
  description: 'Gestão comercial e provisionamento dos clientes do Ecdise SaaS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
