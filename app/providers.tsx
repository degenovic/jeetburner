'use client'

import { NextUIProvider } from '@nextui-org/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { useMemo } from 'react'
import '@solana/wallet-adapter-react-ui/styles.css'

const SOLANA_RPC_ENDPOINT = 'https://api.devnet.solana.com'

export function Providers({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], [])

  return (
    <NextUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
        <ConnectionProvider endpoint={SOLANA_RPC_ENDPOINT}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <main className="min-h-screen bg-black text-foreground">
                {children}
              </main>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </NextThemesProvider>
    </NextUIProvider>
  )
}
