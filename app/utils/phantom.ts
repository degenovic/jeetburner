import { Transaction, TransactionInstruction, Connection, PublicKey, Commitment } from '@solana/web3.js';

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
  connection: Connection,
  expectedReturnAmount?: number // Optional parameter to show expected return amount
) => {
  try {
    // Create a new transaction
    const transaction = new Transaction();
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = provider.publicKey;
    
    // Add instructions to transaction one by one
    // This ensures proper serialization and helps Phantom understand the transaction
    instructions.forEach(instruction => {
      transaction.add(instruction);
    });
    
    // Set transaction options to ensure compatibility with Phantom's Lighthouse guard
    // These options help Phantom understand the transaction purpose
    const options = {
      skipPreflight: false,     // Enable preflight checks
      maxRetries: 3,            // Allow some retries if needed
      preflightCommitment: 'confirmed' as Commitment  // Use confirmed commitment level with proper typing
    };
    
    // Use the recommended signAndSendTransaction method
    // This is the method recommended by Phantom to avoid security warnings
    let result;
    if (provider.signAndSendTransaction) {
      // Pass the options to signAndSendTransaction to help with transaction processing
      result = await provider.signAndSendTransaction(transaction, options);
    } else {
      // Fallback to legacy method if signAndSendTransaction is not available
      const signedTransaction = await provider.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), options);
      result = { signature };
    }
    
    // Return the transaction signature
    return result.signature;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};
