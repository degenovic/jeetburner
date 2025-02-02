'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card, CardBody, Button, Tabs, Tab, Checkbox } from '@nextui-org/react'
import { createV1, updateV1, fetchMetadataFromSeeds, TokenStandard, mintV1 } from '@metaplex-foundation/mpl-token-metadata'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { generateSigner, percentAmount } from '@metaplex-foundation/umi'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, createSetAuthorityInstruction, AuthorityType } from '@solana/spl-token'
import Image from 'next/image'
import Header from './components/Header'
import { Footer } from './components/Footer'

interface TokenAttribute {
  trait_type: string;
  value: string | number;
}

interface TokenProperties {
  files: Array<{ uri: string; type: string }>;
  category: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
}

interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: TokenAttribute[];
  properties: TokenProperties;
}

interface TokenAuthorities {
  revokeMint: boolean;
  revokeFreeze: boolean;
  revokeUpdate: boolean;
}

interface TokenConfig {
  supply: string;
  decimals: string;
}

export default function Home() {
  const { wallet, publicKey } = useWallet()
  const [selectedTab, setSelectedTab] = useState('basic')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Token Metadata
  const [metadata, setMetadata] = useState<TokenMetadata>({
    name: '',
    symbol: '',
    description: '',
    image: '',
    attributes: [],
    properties: {
      files: [],
      category: 'image',
    },
  })

  // Token Configuration
  const [config, setConfig] = useState<TokenConfig>({
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
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setMetadata(prev => ({ ...prev, image: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const updateMetadata = (key: keyof TokenMetadata | keyof TokenProperties, value: string) => {
    if (key in metadata) {
      setMetadata(prev => ({ ...prev, [key]: value }))
    } else {
      setMetadata(prev => ({
        ...prev,
        properties: {
          ...prev.properties,
          [key]: value
        }
      }))
    }
  }

  const updateAuthorities = (key: keyof TokenAuthorities, value: boolean) => {
    switch(key) {
      case 'revokeMint':
      case 'revokeFreeze':
      case 'revokeUpdate':
        setAuthorities(prev => ({ ...prev, [key]: value }));
        break;
      default:
        break;
    }
  }

  const handleCreateToken = async () => {
    if (!publicKey || !wallet?.adapter || !wallet.adapter.publicKey) {
      alert('Please connect your wallet first')
      return
    }

    // Validate input data
    if (!metadata.name || !metadata.symbol || !config.decimals) {
      alert('Please fill in all required fields')
      return
    }

    // Validate lengths
    if (metadata.name.length > 32) {
      alert('Token name must be 32 characters or less')
      return
    }
    if (metadata.symbol.length > 10) {
      alert('Token symbol must be 10 characters or less')
      return
    }

    try {
      setIsLoading(true);

      // Initialize umi with wallet adapter
      const endpoint = clusterApiUrl('devnet');
      const umi = createUmi(endpoint)
        .use(mplTokenMetadata())
        .use(walletAdapterIdentity(wallet.adapter));

      const mint = generateSigner(umi);

      // Function to retry failed transactions
      const retryTransaction = async <T,>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            return await fn();
          } catch (error) {
            if (i === maxRetries - 1) throw error;
            if (error instanceof Error && error.message?.includes('Blockhash not found')) {
              console.log(`Retrying transaction... Attempt ${i + 2}/${maxRetries}`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
            throw error;
          }
        }
        throw new Error('Max retries reached');
      };

      // Create token with retry mechanism
      await retryTransaction(async () => {
        // Create the token
        await createV1(umi, {
          mint,
          authority: umi.identity,
          name: metadata.name,
          symbol: metadata.symbol,
          uri: '', // We'll add metadata JSON support later
          sellerFeeBasisPoints: percentAmount(0),
          tokenStandard: TokenStandard.Fungible,
          decimals: Number(config.decimals),
          updateAuthority: umi.identity,
        }).sendAndConfirm(umi);

        // Mint initial supply
        const supply = BigInt(Number(config.supply) * (10 ** Number(config.decimals)));
        await mintV1(umi, {
          mint: mint.publicKey,
          authority: umi.identity,
          amount: supply,
          tokenOwner: umi.identity.publicKey,
          tokenStandard: TokenStandard.Fungible,
        }).sendAndConfirm(umi);

        // Revoke authorities if requested
        if (authorities.revokeMint || authorities.revokeFreeze) {
          const connection = new Connection(endpoint);
          
          if (authorities.revokeMint) {
            const ix = createSetAuthorityInstruction(
              new PublicKey(mint.publicKey),
              new PublicKey(umi.identity.publicKey),
              AuthorityType.MintTokens,
              null,
              [],
              TOKEN_PROGRAM_ID
            );
            
            const { blockhash } = await connection.getLatestBlockhash();
            const transaction = new Transaction();
            transaction.add(ix);
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = new PublicKey(umi.identity.publicKey);
            
            await wallet.adapter.sendTransaction(transaction, connection);
          }

          if (authorities.revokeFreeze) {
            const ix = createSetAuthorityInstruction(
              new PublicKey(mint.publicKey),
              new PublicKey(umi.identity.publicKey),
              AuthorityType.FreezeAccount,
              null,
              [],
              TOKEN_PROGRAM_ID
            );
            
            const { blockhash } = await connection.getLatestBlockhash();
            const transaction = new Transaction();
            transaction.add(ix);
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = new PublicKey(umi.identity.publicKey);
            
            await wallet.adapter.sendTransaction(transaction, connection);
          }
        }

        // Revoke update authority if requested
        if (authorities.revokeUpdate) {
          console.log('Revoking update authority...');
          const initialMetadata = await fetchMetadataFromSeeds(umi, { mint: mint.publicKey });
          console.log('Initial metadata:', initialMetadata);
          
          // Make a copy of the metadata and set isMutable to false
          const updatedMetadata = {
            ...initialMetadata,
            isMutable: false,
            updateAuthority: null, // Set update authority to null
          };
          console.log('Updated metadata:', updatedMetadata);

          await updateV1(umi, {
            mint: mint.publicKey,
            authority: umi.identity,
            data: updatedMetadata,
            isMutable: false,
          }).sendAndConfirm(umi);

          // Verify the changes
          const finalMetadata = await fetchMetadataFromSeeds(umi, { mint: mint.publicKey });
          console.log('Final metadata:', finalMetadata);
        }
      });

      alert('Token created successfully! Mint address: ' + mint.publicKey)
    } catch (error) {
      console.error('Error creating token:', error)
      const errorMessage = error instanceof Error ? error.message : String(error);
      const userMessage = errorMessage.includes('Blockhash not found')
        ? 'Network error: Please try again in a few moments.'
        : `Error creating token: ${errorMessage}`;
      alert(userMessage);
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />

      <main className="app flex-1 flex items-center justify-center">
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

                    <Button
                      color="primary"
                      className="w-full"
                      onClick={handleCreateToken}
                      isLoading={isLoading}
                      isDisabled={!publicKey || !metadata.name || !metadata.symbol || !config.supply}
                    >
                      Create Token
                    </Button>
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

                    <Button
                      color="primary"
                      className="w-full"
                      onClick={handleCreateToken}
                      isLoading={isLoading}
                      isDisabled={!publicKey || !metadata.name || !metadata.symbol || !config.supply}
                    >
                      Create Token
                    </Button>
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

                    <Button
                      color="primary"
                      className="w-full"
                      onClick={handleCreateToken}
                      isLoading={isLoading}
                      isDisabled={!publicKey || !metadata.name || !metadata.symbol || !config.supply}
                    >
                      Create Token
                    </Button>
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

                    <Button
                      color="primary"
                      className="w-full"
                      onClick={handleCreateToken}
                      isLoading={isLoading}
                      isDisabled={!publicKey || !metadata.name || !metadata.symbol || !config.supply}
                    >
                      Create Token
                    </Button>
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
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
