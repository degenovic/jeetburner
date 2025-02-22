import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

const jetbrains = JetBrains_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pump Token Finder & Claimer',
  description: 'Find and claim empty token accounts on Solana to recover SOL. A tool to help you manage your Solana wallet and reclaim rent from unused token accounts.',
  keywords: 'Solana, Token, Wallet, SOL, Rent, Recovery, Blockchain, Cryptocurrency',
  openGraph: {
    title: 'Pump Token Finder & Claimer',
    description: 'Find and claim empty token accounts on Solana to recover SOL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pump Token Finder & Claimer',
    description: 'Find and claim empty token accounts on Solana to recover SOL',
  },
  verification: {
    google: 'verification_token',
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={jetbrains.className} suppressHydrationWarning>
      <head />
      <body className="bg-[#000000] min-h-screen">
        <Providers>
          {children}
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  )
}
