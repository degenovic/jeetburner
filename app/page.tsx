'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button, Checkbox } from '@nextui-org/react'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'
import { clusterApiUrl } from '@solana/web3.js'
import Header from './components/Header'
import { Footer } from './components/Footer'

// Define a type for the wallet adapter
interface WalletAdapter {
  publicKey?: { toBase58(): string };
  sendTransaction?: (transaction: any, connection: any) => Promise<string>;
}

export default function Home() {
  const { publicKey: walletPublicKey } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState('basic')
  const [metadata, setMetadata] = useState({
    name: '',
    symbol: '',
    description: '',
    properties: {
      website: '',
      twitter: '',
      telegram: '',
      discord: ''
    }
  })
  const [config, setConfig] = useState({
    supply: '',
    decimals: ''
  })
  const [authorities, setAuthorities] = useState({
    revokeMint: false,
    revokeFreeze: false,
    revokeUpdate: false
  })

  const updateMetadata = (field: string, value: string) => {
    if (field === 'website' || field === 'twitter' || field === 'telegram' || field === 'discord') {
      setMetadata(prev => ({
        ...prev,
        properties: {
          ...prev.properties,
          [field]: value
        }
      }))
    } else {
      setMetadata(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const updateAuthorities = (field: string, checked: boolean) => {
    setAuthorities(prev => ({
      ...prev,
      [field]: checked
    }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Logo upload logic would go here
  }

  const handleCreateToken = async () => {
    if (!walletPublicKey) {
      alert('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)
      const endpoint = clusterApiUrl('devnet')
      const umi = createUmi(endpoint)
        .use(mplTokenMetadata())
        .use(walletAdapterIdentity(
          // Safely type the wallet adapter
          (window as { wallet?: { adapter?: WalletAdapter } }).wallet?.adapter ?? {}
        ))

      // Token creation logic would go here
      alert('Token creation not fully implemented yet')
    } catch (error) {
      console.error('Error creating token:', error)
      alert('Failed to create token')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-7xl px-4">
          <div style={{ 
            marginTop: '75px', 
            marginBottom: '75px'
          }}>
            <div className="app-box">
              <div className="app-tabs">
                <button className="app-tab" data-selected={selectedTab === 'basic'} onClick={() => setSelectedTab('basic')}>Basic Info</button>
                <button className="app-tab" data-selected={selectedTab === 'config'} onClick={() => setSelectedTab('config')}>Configuration</button>
                <button className="app-tab" data-selected={selectedTab === 'links'} onClick={() => setSelectedTab('links')}>Social Links</button>
                <button className="app-tab" data-selected={selectedTab === 'authorities'} onClick={() => setSelectedTab('authorities')}>Authorities</button>
                <button className="app-tab" data-selected={selectedTab === 'liquidity'} onClick={() => setSelectedTab('liquidity')}>Liquidity</button>
              </div>

              <div className="app-content">
                {selectedTab === 'basic' && (
                  <div>
                    <div className="mb-6">
                      <label className="input-label">Token Name</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Enter token name"
                        value={metadata.name}
                        onChange={(e) => updateMetadata('name', e.target.value)}
                      />
                    </div>

                    <div className="mb-6">
                      <label className="input-label">Token Symbol</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Enter token symbol"
                        value={metadata.symbol}
                        onChange={(e) => updateMetadata('symbol', e.target.value)}
                      />
                    </div>

                    <div className="mb-6">
                      <label className="input-label">Description</label>
                      <textarea
                        className="input-field"
                        placeholder="Enter token description"
                        value={metadata.description}
                        onChange={(e) => updateMetadata('description', e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="mb-6">
                      <label className="input-label">Token Logo</label>
                      <input
                        type="file"
                        className="input-field"
                        onChange={handleLogoUpload}
                        accept="image/*"
                      />
                    </div>
                  </div>
                )}
                {selectedTab === 'config' && (
                  <div>
                    <div className="mb-6">
                      <label className="input-label">Total Supply</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="Enter total supply"
                        value={config.supply}
                        onChange={(e) => setConfig(prev => ({ ...prev, supply: e.target.value }))}
                      />
                    </div>

                    <div className="mb-6">
                      <label className="input-label">Decimals</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="Enter decimals"
                        value={config.decimals}
                        onChange={(e) => setConfig(prev => ({ ...prev, decimals: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
                {selectedTab === 'links' && (
                  <div>
                    <div className="mb-6">
                      <label className="input-label">Website</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="https://"
                        value={metadata.properties.website || ''}
                        onChange={(e) => updateMetadata('website', e.target.value)}
                      />
                    </div>

                    <div className="mb-6">
                      <label className="input-label">Twitter</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="@username"
                        value={metadata.properties.twitter || ''}
                        onChange={(e) => updateMetadata('twitter', e.target.value)}
                      />
                    </div>

                    <div className="mb-6">
                      <label className="input-label">Telegram</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="t.me/"
                        value={metadata.properties.telegram || ''}
                        onChange={(e) => updateMetadata('telegram', e.target.value)}
                      />
                    </div>

                    <div className="mb-6">
                      <label className="input-label">Discord</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="discord.gg/"
                        value={metadata.properties.discord || ''}
                        onChange={(e) => updateMetadata('discord', e.target.value)}
                      />
                    </div>
                  </div>
                )}
                {selectedTab === 'authorities' && (
                  <div>
                    <div className="space-y-6">
                      <Checkbox
                        isSelected={authorities.revokeMint}
                        onValueChange={(checked) => updateAuthorities('revokeMint', checked)}
                      >
                        Revoke Mint Authority (Permanently disable new token minting)
                      </Checkbox>
                      <div className="h-4"></div>
                      <Checkbox
                        isSelected={authorities.revokeFreeze}
                        onValueChange={(checked) => updateAuthorities('revokeFreeze', checked)}
                      >
                        Revoke Freeze Authority (Permanently disable token freezing)
                      </Checkbox>
                      <div className="h-4"></div>
                      <Checkbox
                        isSelected={authorities.revokeUpdate}
                        onValueChange={(checked) => updateAuthorities('revokeUpdate', checked)}
                      >
                        Revoke Update Authority (Permanently disable token metadata updates)
                      </Checkbox>
                      <div className="h-4"></div>
                    </div>
                    <div className="mt-6 p-4 bg-warning-50 rounded-lg">
                      <p className="text-warning-700 text-sm">
                        Warning: Revoking authorities is permanent and cannot be undone. Once revoked, these permissions cannot be restored.
                      </p>
                    </div>
                  </div>
                )}
                {selectedTab === 'liquidity' && (
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-4">Add Liquidity on Raydium</h3>
                    <Button
                      color="primary"
                      onClick={() => window.open(`https://raydium.io/liquidity/create-pool`, '_blank')}
                    >
                      Add Liquidity on Raydium
                    </Button>
                  </div>
                )}

                {selectedTab !== 'liquidity' && (
                  <div className="mt-6">
                    <Button
                      color="primary"
                      onClick={handleCreateToken}
                      isLoading={isLoading}
                      isDisabled={!walletPublicKey || !metadata.name || !metadata.symbol || !config.supply}
                      className="w-full"
                    >
                      Create Token
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
