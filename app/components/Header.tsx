'use client'

import Link from 'next/link'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Logo } from './Logo'

export default function Header() {
  return (
    <header 
      className="
        sticky top-0 z-50 
        flex items-center justify-between 
        px-4 py-3 
        bg-black/80 
        backdrop-blur-md
        header-border
        mb-8
      "
    >
      <div className="flex items-center">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Logo size={32} />
            <span className="text-xl font-bold">PFTC</span>
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <WalletMultiButton />
      </div>
    </header>
  )
}
