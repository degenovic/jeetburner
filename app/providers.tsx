'use client'

import { NextUIProvider } from '@nextui-org/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ConnectionProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import '@solana/wallet-adapter-react-ui/styles.css'

// Use environment variable or fallback to a default
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
        <ConnectionProvider endpoint={SOLANA_RPC_ENDPOINT}>
          <WalletModalProvider>
            <main className="min-h-screen bg-black text-foreground">
              {children}
            </main>
          </WalletModalProvider>
        </ConnectionProvider>
      </NextThemesProvider>
    </NextUIProvider>
  )
}
