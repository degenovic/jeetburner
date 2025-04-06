'use client'

import Link from 'next/link'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect } from 'react'
import { trackWalletConnect } from '../utils/analytics'
import { Logo } from './Logo'

interface HeaderProps {
  bannerVisible?: boolean;
}

export default function Header({ bannerVisible }: HeaderProps) {
  const { wallet, connected } = useWallet()

  // Track wallet connection events
  useEffect(() => {
    if (connected && wallet) {
      // Track successful connection with wallet name
      trackWalletConnect(wallet.adapter.name)
    }
  }, [connected, wallet])

  return (
    <header 
      className={`
        sticky ${bannerVisible ? 'top-[4.5rem]' : 'top-0'} z-40
        flex items-center justify-between 
        px-6 py-4
        bg-black/90
        backdrop-blur-md
        header-border
        mb-8
        border-b border-gray-800
      `}
    >
      <div className="flex items-center">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Logo size={36} />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text"></span>
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <WalletMultiButton />
      </div>
    </header>
  )
}
