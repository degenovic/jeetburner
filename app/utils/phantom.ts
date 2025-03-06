import { Transaction, TransactionInstruction, Connection, PublicKey } from '@solana/web3.js';

// Add TypeScript declaration for window.solana
declare global {
  interface Window {
    solana?: any;
  }
}

export const getProvider = () => {
  // Check for Phantom in the window object
  if ('phantom' in window) {
    const provider = (window as any).phantom?.solana;
    if (provider?.isPhantom) {
      return provider;
    }
  }
  
  // Check for Solana in the window object (alternate detection method)
  if (window.solana?.isPhantom) {
    return window.solana;
  }
  
  throw new Error('Phantom wallet not found! Please install Phantom wallet extension.');
};

export const signAndSendTransaction = async (
  provider: any,
  instructions: TransactionInstruction[],
  connection: Connection
) => {
  try {
    // Create a new transaction
    const transaction = new Transaction().add(...instructions);
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = provider.publicKey;
    
    // Send transaction using Phantom's signAndSendTransaction
    const { signature } = await provider.signAndSendTransaction(transaction);
    
    return signature;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};
