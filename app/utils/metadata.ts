import { Connection, Transaction } from '@solana/web3.js'
import { 
  createV1,
  TokenStandard,
  mintV1
} from '@metaplex-foundation/mpl-token-metadata'
import { 
  generateSigner, 
  percentAmount,
  Umi,
  publicKey,
  Signer,
  signerIdentity
} from '@metaplex-foundation/umi'

export interface TokenMetadataInput {
  name: string
  symbol: string
  description: string
  image?: string | null
  website?: string
  twitter?: string
  telegram?: string
  discord?: string
}

export const createTokenMetadata = async (
  umi: Umi,
  authority: Signer,
  metadata: TokenMetadataInput,
) => {
  try {
    const mintKeypair = generateSigner(umi)
    
    // Set the authority as the identity
    umi = umi.use(signerIdentity(authority))

    // Create metadata and mint account
    await createV1(umi, {
      mint: mintKeypair,
      authority: authority,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: '', // We'll update this later with IPFS URI
      sellerFeeBasisPoints: percentAmount(0), // 0% royalties
      tokenStandard: TokenStandard.Fungible,
    }).sendAndConfirm(umi)

    // Mint tokens if needed
    await mintV1(umi, {
      mint: mintKeypair.publicKey,
      authority,
      amount: 1,
      tokenOwner: publicKey(authority.publicKey),
      tokenStandard: TokenStandard.Fungible,
    }).sendAndConfirm(umi)

    return mintKeypair.publicKey
  } catch (error) {
    console.error('Error creating token metadata:', error)
    throw error
  }
}
