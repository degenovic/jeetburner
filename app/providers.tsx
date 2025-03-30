'use client'

import { NextUIProvider } from '@nextui-org/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { TorusWalletAdapter } from '@solana/wallet-adapter-torus'
import { LedgerWalletAdapter } from '@solana/wallet-adapter-ledger'
import { SolongWalletAdapter } from '@solana/wallet-adapter-solong'
import { BitpieWalletAdapter } from '@solana/wallet-adapter-bitpie'
import { BitKeepWalletAdapter } from '@solana/wallet-adapter-bitkeep'
import { Coin98WalletAdapter } from '@solana/wallet-adapter-coin98'
import { CloverWalletAdapter } from '@solana/wallet-adapter-clover'
import { MathWalletAdapter } from '@solana/wallet-adapter-mathwallet'
import { TokenPocketWalletAdapter } from '@solana/wallet-adapter-tokenpocket'
import { TrustWalletAdapter } from '@solana/wallet-adapter-trust'
import { WalletConnectWalletAdapter } from '@solana/wallet-adapter-walletconnect'
import { HuobiWalletAdapter } from '@solana/wallet-adapter-huobi'
import { NightlyWalletAdapter } from '@solana/wallet-adapter-nightly'
import { useMemo } from 'react'
import '@solana/wallet-adapter-react-ui/styles.css'

// Use environment variable or fallback to a default
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com'

export function Providers({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    // Skip Torus for now as it requires a client ID
    // new TorusWalletAdapter({ clientId: 'YOUR_TORUS_CLIENT_ID' }),
    new LedgerWalletAdapter(),
    new BitpieWalletAdapter(),
    new BitKeepWalletAdapter(),
    new Coin98WalletAdapter(),
    new CloverWalletAdapter(),
    new MathWalletAdapter(),
    new TokenPocketWalletAdapter(),
    // Configure Trust Wallet with specific options to ensure it works
    new TrustWalletAdapter({ network: 'mainnet' }),
    // Skip WalletConnect for now as it requires additional setup
    // new WalletConnectWalletAdapter({ network: 'mainnet', options: { relayUrl: 'wss://relay.walletconnect.com' } }),
    new NightlyWalletAdapter(),
    new HuobiWalletAdapter(),
    new SolongWalletAdapter(),
  ], [])

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
