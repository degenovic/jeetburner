import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js'
import { PROGRAM_ID as METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata'
import { createCreateMetadataAccountV3Instruction } from '@metaplex-foundation/mpl-token-metadata'

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
  connection: Connection,
  mint: PublicKey,
  payer: PublicKey,
  metadata: TokenMetadataInput,
  sendTransaction: (transaction: Transaction) => Promise<string>
) => {
  const [metadataAddress] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  )

  // Format external URL with website if provided
  const externalUrl = metadata.website || ''

  // Create the metadata
  const instruction = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataAddress,
      mint,
      mintAuthority: payer,
      payer,
      updateAuthority: payer,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          name: metadata.name,
          symbol: metadata.symbol,
          uri: '', // We'll update this later with IPFS URI
          sellerFeeBasisPoints: 0,
          creators: null,
          collection: null,
          uses: null,
        },
        isMutable: true,
        collectionDetails: null,
      },
    }
  )

  const transaction = new Transaction().add(instruction)
  
  try {
    const signature = await sendTransaction(transaction)
    await connection.confirmTransaction(signature, 'confirmed')
    return metadataAddress
  } catch (error) {
    console.error('Error creating token metadata:', error)
    throw error
  }
}
