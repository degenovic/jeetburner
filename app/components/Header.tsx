'use client'

import Link from 'next/link'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Logo } from './Logo'

export default function Header() {
  return (
    <header className="flex justify-between items-center p-4 bg-black text-white border-b border-gray-800">
      <div className="flex items-center">
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <span className="text-xl font-bold">CoinBakery</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/devtools" className="text-sm text-gray-400 hover:text-white transition-colors">
          Dev Tools
        </Link>
        <WalletMultiButton />
      </div>
    </header>
  )
}
