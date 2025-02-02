'use client'

import { Logo } from './Logo'
import { WalletButton } from './WalletButton'
import Link from 'next/link'

export default function Header() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-gray-800 bg-black/80 backdrop-blur-lg py-[5px]">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Logo />
            <div className="hidden md:block ml-10">
              <div className="flex items-center space-x-8">
                <Link 
                  href="/" 
                  className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                >
                  Create Token
                </Link>
                <a 
                  href="https://docs.solana.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                >
                  Docs
                </a>
                <a 
                  href="https://raydium.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                >
                  Raydium
                </a>
              </div>
            </div>
          </div>
          <WalletButton />
        </div>
      </nav>
    </header>
  )
}
