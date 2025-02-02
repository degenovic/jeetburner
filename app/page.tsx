'use client'

import { useState, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Card, CardBody, Button, Input, Textarea, Tabs, Tab, Checkbox } from '@nextui-org/react'
import dynamic from 'next/dynamic'
import { Logo } from './components/Logo'
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, setAuthority, AuthorityType } from '@solana/spl-token'
import Header from './components/Header'
import { Footer } from './components/Footer'

const WalletButton = dynamic(
  () => import('./components/WalletButton').then(mod => mod.WalletButton),
  { ssr: false }
)

interface TokenMetadata {
  name: string
  symbol: string
  description: string
  image: string | null
  website?: string
  twitter?: string
  telegram?: string
  discord?: string
}

interface TokenAuthorities {
  revokeMint: boolean
  revokeFreeze: boolean
  revokeUpdate: boolean
}

export default function Home() {
  const { publicKey, sendTransaction } = useWallet()
  const [selectedTab, setSelectedTab] = useState('basic')
  const [isLoading, setIsLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [mintAddress, setMintAddress] = useState<string>('')

  // Token Metadata
  const [metadata, setMetadata] = useState<TokenMetadata>({
    name: '',
    symbol: '',
    description: '',
    image: null,
    website: '',
    twitter: '',
    telegram: '',
    discord: '',
  })

  // Token Configuration
  const [tokenConfig, setTokenConfig] = useState({
    supply: '',
    decimals: '9',
  })

  // Token Authorities
  const [authorities, setAuthorities] = useState<TokenAuthorities>({
    revokeMint: false,
    revokeFreeze: false,
    revokeUpdate: false,
  })

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
        setMetadata(prev => ({ ...prev, image: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const updateMetadata = (key: keyof TokenMetadata, value: string) => {
    setMetadata(prev => ({ ...prev, [key]: value }))
  }

  const updateAuthorities = (key: keyof TokenAuthorities, value: boolean) => {
    setAuthorities(prev => ({ ...prev, [key]: value }))
  }

  const createToken = async () => {
    if (!publicKey) return

    try {
      setIsLoading(true)
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

      // Create new token mint
      const mint = await createMint(
        connection,
        {
          publicKey,
          sendTransaction,
        },
        publicKey,
        publicKey,
        Number(tokenConfig.decimals)
      )

      setMintAddress(mint.toBase58())

      // Get the token account
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        {
          publicKey,
          sendTransaction,
        },
        mint,
        publicKey
      )

      // Mint tokens
      await mintTo(
        connection,
        {
          publicKey,
          sendTransaction,
        },
        mint,
        tokenAccount.address,
        publicKey,
        Number(tokenConfig.supply) * LAMPORTS_PER_SOL
      )

      // Handle authority revocations
      if (authorities.revokeMint) {
        await setAuthority(
          connection,
          {
            publicKey,
            sendTransaction,
          },
          mint,
          publicKey,
          AuthorityType.MintTokens,
          null // Setting to null revokes the authority
        )
      }

      if (authorities.revokeFreeze) {
        await setAuthority(
          connection,
          {
            publicKey,
            sendTransaction,
          },
          mint,
          publicKey,
          AuthorityType.FreezeAccount,
          null
        )
      }

      if (authorities.revokeUpdate) {
        await setAuthority(
          connection,
          {
            publicKey,
            sendTransaction,
          },
          mint,
          publicKey,
          AuthorityType.UpdateMetadata,
          null
        )
      }

      alert('Token created successfully! Mint address: ' + mint.toBase58())
    } catch (error) {
      console.error('Error creating token:', error)
      alert('Error creating token. Check console for details.')
    } finally {
      setIsLoading(false)
    }
  }

  const goToRaydium = () => {
    if (mintAddress) {
      window.open(`https://raydium.io/liquidity/create-pool?fromMint=${mintAddress}`, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />

      <main className="flex-grow flex justify-center">
        <div className="w-full max-w-7xl px-4">
          <div style={{ 
            marginTop: '75px', 
            textAlign: 'center', 
            padding: '0 16px' 
          }}>
            <h1 style={{ 
              fontSize: 'clamp(1.5rem, 5vw, 3rem)', 
              fontWeight: 'bold', 
              color: 'white',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'nowrap',
              whiteSpace: 'nowrap',
              gap: '8px'
            }}>
              Create Your
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  width: '1.5em',
                  height: '1.5em',
                  display: 'inline-block',
                  verticalAlign: 'middle'
                }}
              >
                <path fillRule="evenodd" clipRule="evenodd" d="M7.08398 5.22265C7.17671 5.08355 7.33282 5 7.5 5H18.5C18.6844 5 18.8538 5.10149 18.9408 5.26407C19.0278 5.42665 19.0183 5.62392 18.916 5.77735L16.916 8.77735C16.8233 8.91645 16.6672 9 16.5 9H5.5C5.3156 9 5.14617 8.89851 5.05916 8.73593C4.97215 8.57335 4.98169 8.37608 5.08398 8.22265L7.08398 5.22265ZM7.76759 6L6.43426 8H16.2324L17.5657 6H7.76759Z" fill="white"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M7.08398 15.2226C7.17671 15.0836 7.33282 15 7.5 15H18.5C18.6844 15 18.8538 15.1015 18.9408 15.2641C19.0278 15.4267 19.0183 15.6239 18.916 15.7774L16.916 18.7774C16.8233 18.9164 16.6672 19 16.5 19H5.5C5.3156 19 5.14617 18.8985 5.05916 18.7359C4.97215 18.5734 4.98169 18.3761 5.08398 18.2226L7.08398 15.2226ZM7.76759 16L6.43426 18H16.2324L17.5657 16H7.76759Z" fill="white"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M7.08398 13.7774C7.17671 13.9164 7.33282 14 7.5 14H18.5C18.6844 14 18.8538 13.8985 18.9408 13.7359C19.0278 13.5733 19.0183 13.3761 18.916 13.2226L16.916 10.2226C16.8233 10.0836 16.6672 10 16.5 10H5.5C5.3156 10 5.14617 10.1015 5.05916 10.2641C4.97215 10.4267 4.98169 10.6239 5.08398 10.7774L7.08398 13.7774ZM7.76759 13L6.43426 11H16.2324L17.5657 13H7.76759Z" fill="white"/>
              </svg>
              Token With Ease
            </h1>
            <p style={{ 
              fontSize: 'clamp(0.75rem, 4vw, 0.875rem)', 
              color: '#9ca3af', 
              maxWidth: '32rem',
              marginTop: '4px',
              marginBottom: '48px',
              margin: '4px auto 48px',
              lineHeight: '1.5'
            }}>
              Launch your Solana token in minutes. Set your tokenomics, add metadata, and deploy to the blockchain with ease.
            </p>
          </div>

          <div className="flex justify-center w-full">
            <div className="w-full max-w-3xl">
              <div className="py-16 space-y-16">
                <div className="mt-16">
                  <Card className="bg-black border border-gray-800">
                    <CardBody className="px-8 py-10">
                      <Tabs 
                        selectedKey={selectedTab} 
                        onSelectionChange={(key) => setSelectedTab(key.toString())}
                      >
                        <Tab key="basic" title="Basic Info">
                          <div className="space-y-12 py-6">
                            <div>
                              <Input
                                label="Token Name"
                                placeholder="Enter token name"
                                value={metadata.name}
                                onChange={(e) => updateMetadata('name', e.target.value)}
                              />
                              <div className="h-4"></div>
                            </div>
                            <div>
                              <Input
                                label="Token Symbol"
                                placeholder="Enter token symbol"
                                value={metadata.symbol}
                                onChange={(e) => updateMetadata('symbol', e.target.value)}
                              />
                              <div className="h-4"></div>
                            </div>
                            <div>
                              <Textarea
                                label="Description"
                                placeholder="Enter token description"
                                value={metadata.description}
                                onChange={(e) => updateMetadata('description', e.target.value)}
                              />
                              <div className="h-4"></div>
                            </div>
                            <div>
                              <label className="block text-base font-medium text-white/80 mb-3">Token Logo</label>
                              <div className="flex items-center space-x-4">
                                {logoPreview && (
                                  <img
                                    src={logoPreview}
                                    alt="Token logo preview"
                                    className="w-24 h-24 object-cover rounded-lg"
                                  />
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleLogoUpload}
                                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-600"
                                />
                              </div>
                              <div className="h-4"></div>
                            </div>
                          </div>
                        </Tab>
                        <Tab key="config" title="Configuration">
                          <div className="space-y-12 py-6">
                            <div>
                              <Input
                                label="Total Supply"
                                placeholder="Enter total supply"
                                type="number"
                                value={tokenConfig.supply}
                                onChange={(e) => setTokenConfig(prev => ({ ...prev, supply: e.target.value }))}
                              />
                              <div className="h-4"></div>
                            </div>
                            <div>
                              <Input
                                label="Decimals"
                                placeholder="Enter decimals"
                                type="number"
                                value={tokenConfig.decimals}
                                onChange={(e) => setTokenConfig(prev => ({ ...prev, decimals: e.target.value }))}
                              />
                              <div className="h-4"></div>
                            </div>
                          </div>
                        </Tab>
                        <Tab key="links" title="Social Links">
                          <div className="space-y-12 py-6">
                            <div>
                              <Input
                                label="Website"
                                placeholder="https://"
                                value={metadata.website}
                                onChange={(e) => updateMetadata('website', e.target.value)}
                              />
                              <div className="h-4"></div>
                            </div>
                            <div>
                              <Input
                                label="Twitter"
                                placeholder="@username"
                                value={metadata.twitter}
                                onChange={(e) => updateMetadata('twitter', e.target.value)}
                              />
                              <div className="h-4"></div>
                            </div>
                            <div>
                              <Input
                                label="Telegram"
                                placeholder="t.me/"
                                value={metadata.telegram}
                                onChange={(e) => updateMetadata('telegram', e.target.value)}
                              />
                              <div className="h-4"></div>
                            </div>
                            <div>
                              <Input
                                label="Discord"
                                placeholder="discord.gg/"
                                value={metadata.discord}
                                onChange={(e) => updateMetadata('discord', e.target.value)}
                              />
                              <div className="h-4"></div>
                            </div>
                          </div>
                        </Tab>
                        <Tab key="authorities" title="Authorities">
                          <div className="space-y-12 py-6">
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
                                Revoke Update Authority (Permanently disable metadata updates)
                              </Checkbox>
                              <div className="h-4"></div>
                            </div>
                            <div className="mt-6 p-4 bg-warning-50 rounded-lg">
                              <p className="text-warning-700 text-sm">
                                Warning: Revoking authorities is permanent and cannot be undone. Once revoked, these permissions cannot be restored.
                              </p>
                            </div>
                          </div>
                        </Tab>
                        <Tab key="liquidity" title="Add Liquidity" isDisabled={!mintAddress}>
                          <div className="space-y-6 py-4">
                            <div className="text-center">
                              <h3 className="text-xl font-semibold mb-4">Add Liquidity on Raydium</h3>
                              {mintAddress ? (
                                <>
                                  <p className="mb-4">Your token has been created! The mint address is:</p>
                                  <code className="block p-3 bg-content2 rounded-lg mb-6 break-all">
                                    {mintAddress}
                                  </code>
                                  <Button
                                    color="primary"
                                    onClick={goToRaydium}
                                  >
                                    Add Liquidity on Raydium
                                  </Button>
                                </>
                              ) : (
                                <p>First create your token to add liquidity on Raydium.</p>
                              )}
                            </div>
                          </div>
                        </Tab>
                      </Tabs>
                      {selectedTab !== 'liquidity' && (
                        <div className="mt-12">
                          <Button
                            color="primary"
                            onClick={createToken}
                            isLoading={isLoading}
                            isDisabled={!publicKey || !metadata.name || !metadata.symbol || !tokenConfig.supply}
                          >
                            Create Token
                          </Button>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
