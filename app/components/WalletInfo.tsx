'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletType, detectWalletType } from '../utils/walletUtils'

const walletNames = {
  [WalletType.PHANTOM]: 'Phantom',
  [WalletType.SOLFLARE]: 'Solflare',
  [WalletType.TRUSTWALLET]: 'Trust Wallet',
  [WalletType.BACKPACK]: 'Backpack',
  [WalletType.COINBASE]: 'Coinbase Wallet',
  [WalletType.COIN98]: 'Coin98',
  [WalletType.SLOPE]: 'Slope',
  [WalletType.UNKNOWN]: 'Unknown'
}

const supportedWallets = [
  { type: WalletType.PHANTOM, name: 'Phantom', status: 'Fully Supported' },
  { type: WalletType.SOLFLARE, name: 'Solflare', status: 'Fully Supported' },
  { type: WalletType.TRUSTWALLET, name: 'Trust Wallet', status: 'Detection Only' },
  { type: WalletType.COIN98, name: 'Coin98', status: 'Fully Supported' },
  { type: WalletType.SLOPE, name: 'Slope', status: 'Fully Supported' },
  { type: WalletType.BACKPACK, name: 'Backpack', status: 'Detection Only' },
  { type: WalletType.COINBASE, name: 'Coinbase Wallet', status: 'Detection Only' }
]

export function WalletInfo() {
  const { connected } = useWallet()
  const [detectedWallet, setDetectedWallet] = useState<WalletType>(WalletType.UNKNOWN)
  const [showSupportedWallets, setShowSupportedWallets] = useState(false)

  useEffect(() => {
    // Only run detection if we have access to the window object
    if (typeof window !== 'undefined') {
      const walletType = detectWalletType()
      setDetectedWallet(walletType)
    }
  }, [connected]) // Re-run when connection status changes

  return (
    <div className="mt-4 p-4 bg-gray-800 rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Detected Wallet: {detectedWallet !== WalletType.UNKNOWN ? (
            <span className="text-green-400">{walletNames[detectedWallet]}</span>
          ) : (
            <span className="text-yellow-400">None</span>
          )}
        </h3>
        <button 
          onClick={() => setShowSupportedWallets(!showSupportedWallets)}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          {showSupportedWallets ? 'Hide' : 'Show'} Supported Wallets
        </button>
      </div>

      {showSupportedWallets && (
        <div className="mt-3">
          <h4 className="text-md font-medium mb-2">Wallet Compatibility:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {supportedWallets.map((wallet) => (
              <div 
                key={wallet.type} 
                className={`p-2 rounded border ${
                  detectedWallet === wallet.type 
                    ? 'border-green-500 bg-green-900/20' 
                    : 'border-gray-600'
                }`}
              >
                <div className="flex justify-between">
                  <span className="font-medium">{wallet.name}</span>
                  <span 
                    className={`text-xs px-2 py-0.5 rounded ${
                      wallet.status === 'Fully Supported' 
                        ? 'bg-green-900/50 text-green-400' 
                        : 'bg-yellow-900/50 text-yellow-400'
                    }`}
                  >
                    {wallet.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            "Fully Supported" wallets can connect and sign transactions. "Detection Only" wallets may be detected but have limited functionality.
          </p>
        </div>
      )}
    </div>
  )
}
