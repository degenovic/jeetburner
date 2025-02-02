'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card, CardBody, CardHeader, Button, Input, Divider } from '@nextui-org/react'
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
        <div className="w-full max-w-4xl p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-900 to-black rounded-xl border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">Developer Tools</h1>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-black/50 border-gray-800">
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md">Token Authority Tests</p>
                  <p className="text-small text-default-500">Test if token authorities have been properly revoked</p>
                </div>
              </CardHeader>
              <Divider className="bg-gray-800"/>
              <CardBody>
                <div className="flex flex-col gap-4">
                  <Input
                    label="Token Mint Address"
                    placeholder="Enter the token&apos;s mint address"
                    value={mintAddress}
                    onChange={(e) => setMintAddress(e.target.value)}
                    description="The mint address of the token you want to test"
                    classNames={{
                      label: "text-white",
                      input: "bg-black/50 text-white",
                      description: "text-gray-400"
                    }}
                  />
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-white mb-2">Update Authority Test</h3>
                      <p className="text-sm text-gray-400 mb-2">
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

                    <div>
                      <h3 className="text-white mb-2">Mint Authority Test</h3>
                      <p className="text-sm text-gray-400 mb-2">
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

                    <div>
                      <h3 className="text-white mb-2">Freeze Authority Test</h3>
                      <p className="text-sm text-gray-400 mb-2">
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
                </div>
              </CardBody>
            </Card>

            <Card className="bg-black/50 border-gray-800">
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md">Token Information</p>
                  <p className="text-small text-default-500">View detailed information about your token</p>
                </div>
              </CardHeader>
              <Divider className="bg-gray-800"/>
              <CardBody>
                <p className="text-gray-400">Token information viewer coming soon...</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
