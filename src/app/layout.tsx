import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { fontClassico, fontModerno, fontBoteco } from '@/lib/theme'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'CardápioQR — Cardápio Digital por QR Code',
    template: '%s | CardápioQR',
  },
  description:
    'Crie seu cardápio digital em minutos. Compartilhe por QR Code com seus clientes. Sem taxas mensais absurdas.',
  keywords: ['cardápio digital', 'qr code', 'restaurante', 'bar', 'delivery'],
  openGraph: {
    title: 'CardápioQR — Cardápio Digital por QR Code',
    description: 'Crie seu cardápio digital em minutos e compartilhe por QR Code.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="pt-BR"
      className={`${fontClassico.variable} ${fontModerno.variable} ${fontBoteco.variable}`}
      suppressHydrationWarning
    >
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#f97316',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
