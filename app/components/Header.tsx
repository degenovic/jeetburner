'use client'

import React, { useState } from 'react';
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
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false)

  // Track wallet connection events
  useEffect(() => {
    if (connected && wallet) {
      // Track successful connection with wallet name
      trackWalletConnect(wallet.adapter.name)
    }
  }, [connected, wallet])

  return (
    <>
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
          <button 
            onClick={() => setIsReferralModalOpen(true)}
            className="text-sm text-[#ab9ff2] hover:text-white transition-colors mr-2 flex items-center gap-1"
          >
            <span>🔗</span> Refer & Earn 50%
          </button>
          <WalletMultiButton />
        </div>
      </header>

      {/* Referral Modal */}
      {isReferralModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-10 sm:pt-20">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsReferralModalOpen(false)}
          />
          
          {/* Modal content */}
          <div 
            className="relative z-50 rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl mt-4"
            style={{
              background: 'rgba(0, 0, 0, 0.95)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div className="p-5">
              <div className="relative mb-6 sticky top-0 bg-black py-4 -mt-2 -mx-2 px-2 text-center">
                <h2 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-600">Refer & Earn 50%</h2>
                <button 
                  onClick={() => setIsReferralModalOpen(false)}
                  className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-full transition-colors absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', padding: '0 10px', marginBottom: '30px' }}>
                <div className="px-2">
                  <p className="text-gray-200 p-3 pr-2">
                  That's right, Fiddy/Fiddy - we believe in a fair 50/50 split! 💰</p>
                  <p className="text-gray-200 p-3 pr-2">When someone uses your referral link to burn their empty token accounts, 
                  you'll earn 50% of our burn fee.</p>
                  <div className="bg-gray-800 p-3 rounded-lg mt-4">
                    <h3 className="font-semibold mb-2 text-white">How it works:</h3>
                    <ul className="list-disc list-inside text-gray-300">
                      <li>Connect your wallet and get a unique referral link</li>
                      <li>Share your unique referral link</li>
                      <li>When someone burns token accounts using your link</li>
                      <li>You earn 50% of the burn fee!</li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-400 p-3 mt-4">
                    The more people you refer, the more you earn. Spread the word and start burning! 🔥
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
