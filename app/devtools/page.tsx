'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from '@nextui-org/react'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'
import { clusterApiUrl } from '@solana/web3.js'
import { updateV1, fetchMetadataFromSeeds } from '@metaplex-foundation/mpl-token-metadata'
import { publicKey } from '@metaplex-foundation/umi'
import Header from '../components/Header'
import { Footer } from '../components/Footer'

export default function DevTools() {
  const { publicKey: walletPublicKey, wallet } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [mintAddress, setMintAddress] = useState('')
  const [selectedTab, setSelectedTab] = useState('update')

  const handleTestUpdateAuthority = async () => {
    if (!walletPublicKey || !wallet?.adapter || !wallet.adapter.publicKey) {
      alert('Please connect your wallet first')
      return
    }

    if (!mintAddress) {
      alert('Please enter a mint address')
      return
    }

    try {
      setIsLoading(true)
      const endpoint = clusterApiUrl('devnet')
      const umi = createUmi(endpoint)
        .use(mplTokenMetadata())
        .use(walletAdapterIdentity(wallet.adapter))

      // Try to update the metadata
      const metadata = await fetchMetadataFromSeeds(umi, { 
        mint: publicKey(mintAddress)
      });

      await updateV1(umi, {
        mint: publicKey(mintAddress),
        authority: umi.identity,
        data: {
          ...metadata,
          name: metadata.name + " Updated",
        },
      }).sendAndConfirm(umi);

      alert('If you see this, update authority is NOT revoked!')
    } catch (error) {
      console.error('Error updating metadata:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('immutable')) {
        alert('Update failed - metadata is immutable (this is good, update authority is properly revoked)')
      } else {
        alert('Error: ' + errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestMintAuthority = async () => {
    // TODO: Implement mint authority test
    alert('Mint authority test not implemented yet')
  }

  const handleTestFreezeAuthority = async () => {
    // TODO: Implement freeze authority test
    alert('Freeze authority test not implemented yet')
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-7xl px-4">
          <div style={{ marginTop: '75px', marginBottom: '75px' }}>
            <div className="app-box">
              <div className="app-tabs">
                <button 
                  className="app-tab" 
                  data-selected={selectedTab === 'update'} 
                  onClick={() => setSelectedTab('update')}
                >
                  Update Authority
                </button>
                <button 
                  className="app-tab" 
                  data-selected={selectedTab === 'mint'} 
                  onClick={() => setSelectedTab('mint')}
                >
                  Mint Authority
                </button>
                <button 
                  className="app-tab" 
                  data-selected={selectedTab === 'freeze'} 
                  onClick={() => setSelectedTab('freeze')}
                >
                  Freeze Authority
                </button>
              </div>

              <div className="app-content">
                {selectedTab === 'update' && (
                  <div>
                    <div className="mb-6">
                      <label className="input-label">Token Mint Address</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Enter the token's mint address"
                        value={mintAddress}
                        onChange={(e) => setMintAddress(e.target.value)}
                      />
                      <p className="input-description">
                        The mint address of the token you want to test
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-4">
                        This test attempts to update the token&apos;s metadata. If the update authority 
                        is properly revoked (isMutable = false), this will fail with an &quot;immutable&quot; error.
                      </p>
                      <Button
                        color="primary"
                        onClick={handleTestUpdateAuthority}
                        isLoading={isLoading}
                        className="w-full"
                      >
                        Test Update Authority
                      </Button>
                    </div>
                  </div>
                )}

                {selectedTab === 'mint' && (
                  <div>
                    <div className="mb-6">
                      <label className="input-label">Token Mint Address</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Enter the token's mint address"
                        value={mintAddress}
                        onChange={(e) => setMintAddress(e.target.value)}
                      />
                      <p className="input-description">
                        The mint address of the token you want to test
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-4">
                        This test attempts to mint new tokens. If the mint authority is properly 
                        revoked, this will fail with a permissions error.
                      </p>
                      <Button
                        color="primary"
                        onClick={handleTestMintAuthority}
                        isLoading={isLoading}
                        className="w-full"
                      >
                        Test Mint Authority
                      </Button>
                    </div>
                  </div>
                )}

                {selectedTab === 'freeze' && (
                  <div>
                    <div className="mb-6">
                      <label className="input-label">Token Mint Address</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Enter the token's mint address"
                        value={mintAddress}
                        onChange={(e) => setMintAddress(e.target.value)}
                      />
                      <p className="input-description">
                        The mint address of the token you want to test
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-4">
                        This test attempts to freeze a token account. If the freeze authority is 
                        properly revoked, this will fail with a permissions error.
                      </p>
                      <Button
                        color="primary"
                        onClick={handleTestFreezeAuthority}
                        isLoading={isLoading}
                        className="w-full"
                      >
                        Test Freeze Authority
                      </Button>
                    </div>
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
