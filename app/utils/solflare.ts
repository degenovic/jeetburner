import { PublicKey, Transaction, TransactionInstruction, Connection } from '@solana/web3.js';

// Add TypeScript declaration for window.solflare
declare global {
  interface Window {
    solflare?: any;
  }
}

export const getProvider = () => {
  // Check for Solflare in the window object
  if ('solflare' in window) {
    const provider = window.solflare;
    if (provider?.isSolflare) {
      return provider;
    }
  }
  
  throw new Error('Solflare wallet not found! Please install Solflare wallet extension.');
};

export const signAndSendTransaction = async (
  provider: any,
  instructions: TransactionInstruction[],
  connection: Connection
) => {
  try {
    // Create a new transaction
    const transaction = new Transaction();
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = provider.publicKey;
    
    // Add instructions to transaction
    instructions.forEach(instruction => {
      transaction.add(instruction);
    });
    
    // Set transaction options
    const options = {
      skipPreflight: false,
      maxRetries: 3
    };
    
    // Send transaction using Solflare's signAndSendTransaction
    const { signature } = await provider.signAndSendTransaction(transaction);
    
    // Return the transaction signature
    return signature;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};
