import { TransactionInstruction, Connection } from '@solana/web3.js';

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
    // Phantom will create the transaction with proper space if we just pass instructions
    const { signature } = await provider.signAndSendTransaction({
      instructions,
      options: {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
        // Explicitly tell Phantom to add security checks
        securityGuard: true  
      }
    });
    
    return signature;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};
