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
  metadataBase: new URL('https://jeetburner.com'),
  openGraph: {
    title: 'JeetBurner - Burn Empty Token Accounts',
    description: 'Find and claim empty token accounts on Solana to recover SOL',
    type: 'website',
    siteName: 'JeetBurner',
    locale: 'en_US',
    url: 'https://jeetburner.com',
    images: [{
      url: '/images/social/jeetelmo.png',
      width: 1200,
      height: 630,
      alt: 'JeetBurner Logo'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JeetBurner - Burn Empty Token Accounts',
    description: 'Find and claim empty token accounts on Solana to recover SOL',
    site: '@jeetburner',
    creator: '@jeetburner',
    images: ['/images/social/jeetelmo.png'],
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
      <head>
        {/* Direct meta tags for social media previews */}
        <meta property="og:title" content="JeetBurner - Burn Empty Token Accounts" />
        <meta property="og:description" content="Find and claim empty token accounts on Solana to recover SOL" />
        <meta property="og:image" content="https://jeetburner.com/images/social/jeetelmo.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://jeetburner.com" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="JeetBurner" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="JeetBurner - Burn Empty Token Accounts" />
        <meta name="twitter:description" content="Find and claim empty token accounts on Solana to recover SOL" />
        <meta name="twitter:image" content="https://jeetburner.com/images/social/jeetelmo.png" />
        <meta name="twitter:site" content="@jeetburner" />
        <meta name="twitter:creator" content="@jeetburner" />
      </head>
      <body className="bg-[#000000] min-h-screen">
        <Providers>
          {children}
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  )
}
