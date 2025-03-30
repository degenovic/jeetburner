import { PublicKey, Transaction, TransactionInstruction, Connection } from '@solana/web3.js';

// Add TypeScript declaration for window.backpack
declare global {
  interface Window {
    backpack?: any;
    xnft?: any;
  }
}

export const getProvider = () => {
  // Check for Backpack in the window object
  if ('backpack' in window) {
    const provider = window.backpack?.solana;
    if (provider) {
      return provider;
    }
  }
  
  // Backpack may also inject as xnft
  if ('xnft' in window && window.xnft?.solana) {
    return window.xnft.solana;
  }
  
  throw new Error('Backpack wallet not found! Please install Backpack wallet extension.');
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
    
    // Send transaction using Backpack's signAndSendTransaction
    const { signature } = await provider.signAndSendTransaction(transaction);
    
    // Return the transaction signature
    return signature;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};
