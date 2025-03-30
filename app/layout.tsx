import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

const jetbrains = JetBrains_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'JeetBurner - Burn Empty Token Accounts',
  description: 'Find and claim empty token accounts on Solana to recover SOL. A tool to help you manage your Solana wallet and reclaim rent from unused token accounts.',
  keywords: 'Solana, Token, Wallet, SOL, Rent, Recovery, Blockchain, Cryptocurrency',
  openGraph: {
    title: 'JeetBurner - Burn Empty Token Accounts',
    description: 'Find and claim empty token accounts on Solana to recover SOL',
    type: 'website',
    siteName: 'JeetBurner',
    locale: 'en_US',
    url: 'https://jeetburner.com',
    images: [{
      url: 'https://jeetburner.com/images/jeetelmo.gif',
      width: 800,
      height: 600,
      alt: 'JeetBurner Logo'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JeetBurner - Burn Empty Token Accounts',
    description: 'Find and claim empty token accounts on Solana to recover SOL',
    site: '@jeetburner',
    creator: '@jeetburner',
    images: ['https://jeetburner.com/images/jeetelmo.gif'],
  },
  verification: {
    google: 'verification_token',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
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
