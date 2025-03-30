import { PublicKey, Transaction, TransactionInstruction, Connection } from '@solana/web3.js';

export const getProvider = () => {
  // Check for Slope in the window object
  if ('Slope' in window) {
    const provider = (window as any).Slope;
    if (provider) {
      return provider;
    }
  }
  
  // Slope may also inject as solana
  if (window.solana && !window.solana.isPhantom && !window.solana.isSolflare) {
    // Check if it's likely Slope Wallet
    if (window.solana.isSlope) {
      return window.solana;
    }
  }
  
  throw new Error('Slope Wallet not found! Please install Slope Wallet extension.');
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
    
    // Send transaction using Slope's signAndSendTransaction
    const { signature } = await provider.signAndSendTransaction(transaction);
    
    // Return the transaction signature
    return signature;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};
