'use client'

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export function WalletButton() {
  return (
    <div className="wallet-adapter-button-container">
      <WalletMultiButton />
    </div>
  )
}
