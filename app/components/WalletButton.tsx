'use client'

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useCallback } from 'react'
import { trackWalletConnect } from '../utils/analytics'

export function WalletButton() {
  const { wallet, connected } = useWallet()

  // Track wallet connection events
  useEffect(() => {
    if (connected && wallet) {
      // Track successful connection with wallet name
      trackWalletConnect(wallet.adapter.name)
    }
  }, [connected, wallet])

  return (
    <div className="wallet-adapter-button-container">
      <WalletMultiButton />
    </div>
  )
}
