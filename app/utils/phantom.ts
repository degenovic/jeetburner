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
    // Create a new transaction and add instructions
    const transaction = new Transaction();
    
    // Get latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = provider.publicKey;
    
    // Add instructions at the end to ensure space for Lighthouse
    instructions.forEach(instruction => transaction.add(instruction));
    
    // Let Phantom handle signing and sending with options
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
