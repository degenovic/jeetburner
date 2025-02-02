import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const jetbrains = JetBrains_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CoinBakery | Create Solana Tokens',
  description: 'Create your own Solana token in minutes with CoinBakery - the easiest way to launch your token on Solana.',
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
        </Providers>
      </body>
    </html>
  )
}
