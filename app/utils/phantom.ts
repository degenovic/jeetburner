import { Transaction, Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';

export const getProvider = () => {
  if ('phantom' in window) {
    const provider = (window as any).phantom?.solana;
    if (provider?.isPhantom) {
      return provider;
    }
  }
  throw new Error('Phantom wallet not found!');
};

export const signAndSendTransaction = async (
  provider: any,
  instructions: TransactionInstruction[],
  connection: Connection
) => {
  try {
    // Create transaction with empty instructions first
    const transaction = new Transaction();
    
    // Get latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = provider.publicKey;

    // Add dummy instruction to reserve space (will be replaced by Phantom)
    transaction.add({
      keys: [],
      programId: PublicKey.default,
      data: Buffer.alloc(600), // Reserve 600 bytes for Lighthouse
    });

    // Add our actual instructions
    instructions.forEach(instruction => transaction.add(instruction));

    // Send with Phantom's recommended options
    const { signature } = await provider.signAndSendTransaction(transaction, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 3,
    });
    
    return signature;
  } catch (error) {
    console.error('Error signing and sending transaction:', error);
    throw error;
  }
};
